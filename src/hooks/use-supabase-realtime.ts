import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { updateAreaStatus, upsertReport, updateReportConfidence } from '@/store/slices/dataSlice';

export function useSupabaseRealtime() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Subscribe to Area status updates
    const areasChannel = supabase
      .channel('public:areas')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'areas' },
        (payload) => {
          const { id, current_status } = payload.new;
          dispatch(updateAreaStatus({ id, current_status }));
        }
      )
      .subscribe();

    // 2. Subscribe to new Reports (Insert/Update)
    const reportsChannel = supabase
      .channel('public:reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          // Note: payload.new doesn't have area_name. We might need a small helper if we want to fetch it, 
          // but Redux usually maps it out or we can let it be 'Unknown Area' temporarily until refresh.
          const newReport = {
            ...payload.new,
            area_name: 'Live Report', // Placeholder, map UI handles ID linking
            has_confirmed: false,
          } as any;
          dispatch(upsertReport(newReport));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          // If confidence score or status changes
          const { id, confidence_score } = payload.new;
          dispatch(updateReportConfidence({ id, newScore: confidence_score }));
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(areasChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [dispatch]);
}
