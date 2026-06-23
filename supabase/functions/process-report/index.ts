// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: "Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing or empty in the Edge Function secrets!" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    const { area_id, status, comment, latitude, longitude, device_id, expires_at } = payload;

    if (!area_id || !status || !device_id || !expires_at) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. FRAUD DETECTION
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: recentReports } = await supabaseClient
      .from('reports')
      .select('id, status, area_id, created_at')
      .eq('device_id', device_id)
      .gte('created_at', oneHourAgo);

    let trust_weight = 1;

    // A. Velocity Limiting (>5 reports per hour)
    if (recentReports && recentReports.length >= 5) {
      trust_weight = 0;
    }

    // B. Duplicate Spam (Same area, same status within 5 minutes)
    if (recentReports) {
      const recentDuplicates = recentReports.filter(r => r.area_id === area_id && r.status === status && r.created_at >= fiveMinutesAgo);
      if (recentDuplicates.length > 0) {
        trust_weight = 0;
      }
    }

    // 2. GEO CLUSTERING
    // If user provided lat/lng, look for existing active reports of the SAME status within 500m
    let clusteredReportId = null;

    if (latitude && longitude) {
      // Find active reports in the same area
      const now = new Date().toISOString();
      const { data: activeAreaReports } = await supabaseClient
        .from('reports')
        .select('id, latitude, longitude, status')
        .eq('area_id', area_id)
        .eq('status', status)
        .gt('expires_at', now);

      if (activeAreaReports) {
        for (const report of activeAreaReports) {
          if (report.latitude && report.longitude) {
            const distance = haversineDistance(latitude, longitude, report.latitude, report.longitude);
            if (distance <= 0.5) { // 500 meters
              clusteredReportId = report.id;
              break;
            }
          }
        }
      }
    }

    let finalReport;

    if (clusteredReportId) {
      // It's a cluster! Instead of a new report, we add a confirmation.
      // 1. Insert confirmation (this might fail if device_id already confirmed this report, which is fine)
      const { error: confError } = await supabaseClient
        .from('confirmations')
        .insert({ report_id: clusteredReportId, device_id });

      // 2. Increase confidence score of clustered report
      if (!confError && trust_weight > 0) {
        const { data: updatedReport } = await supabaseClient
          .rpc('increment_confidence', { row_id: clusteredReportId, amount: trust_weight });
        // (Note: Since we cannot easily do RPC without creating the function in Postgres, 
        // we'll fetch and update, or just use a generic update if not heavily concurrent)

        const { data: currentScoreData } = await supabaseClient
          .from('reports')
          .select('confidence_score')
          .eq('id', clusteredReportId)
          .single();

        if (currentScoreData) {
          await supabaseClient
            .from('reports')
            .update({ confidence_score: currentScoreData.confidence_score + trust_weight })
            .eq('id', clusteredReportId);
        }
      }

      // Fetch the clustered report to return to the client
      const { data } = await supabaseClient.from('reports').select('*').eq('id', clusteredReportId).single();
      finalReport = data;

    } else {
      // Insert brand new report
      const { data, error } = await supabaseClient
        .from('reports')
        .insert({
          area_id,
          status,
          comment,
          latitude,
          longitude,
          device_id,
          expires_at,
          confidence_score: trust_weight // Start with trust weight
        })
        .select()
        .single();

      if (error) throw error;
      finalReport = data;
    }

    // 3. RECOMPUTE AREA STATUS
    const now = new Date().toISOString();
    const { data: activeReports } = await supabaseClient
      .from('reports')
      .select('status, confidence_score')
      .eq('area_id', area_id)
      .gt('expires_at', now)
      .gt('confidence_score', 0); // Ignore fully penalized spam

    let newAreaStatus = 'UNKNOWN';
    if (activeReports && activeReports.length > 0) {
      const scores = { LIGHT_AVAILABLE: 0, LIGHT_OUT: 0, LOW_VOLTAGE: 0 };
      activeReports.forEach((r: any) => {
        if (scores[r.status as keyof typeof scores] !== undefined) {
          scores[r.status as keyof typeof scores] += r.confidence_score;
        }
      });

      let highestStatus = 'UNKNOWN';
      let maxScore = -1;
      Object.entries(scores).forEach(([st, score]) => {
        if (score > maxScore) {
          maxScore = score;
          highestStatus = st;
        }
      });
      newAreaStatus = highestStatus;
    }

    // Update area status (Triggers Realtime to frontend!)
    await supabaseClient
      .from('areas')
      .update({ current_status: newAreaStatus, last_reported_at: new Date().toISOString() })
      .eq('id', area_id);

    return new Response(JSON.stringify({ success: true, report: finalReport, clustered: !!clusteredReportId, trust_weight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
  console.log('Edge error:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 400,
  });
}
})
