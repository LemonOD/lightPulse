import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Area, Report, ReportStatus } from "@/lib/types";
import { dbService, getAreaStatusFromReports } from "@/lib/db";
import { normalizeAreaToH3 } from "@/lib/h3-utils";

interface DataState {
  areas: Area[];
  reports: Report[];
  historicalReports: Record<string, Report[]>;
  historicalLoading: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: DataState = {
  areas: [],
  reports: [],
  historicalReports: {},
  historicalLoading: false,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchInitialData = createAsyncThunk(
  "data/fetchInitial",
  async (_, { rejectWithValue }) => {
    try {
      const [areas, reports] = await Promise.all([
        dbService.getAreas(),
        dbService.getReports()
      ]);
      return { areas, reports };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load initial data";
      return rejectWithValue(msg);
    }
  }
);

export const fetchHistoricalData = createAsyncThunk(
  "data/fetchHistorical",
  async ({ areaId, days }: { areaId: string; days: number }, { rejectWithValue }) => {
    try {
      const reports = await dbService.getHistoricalReports(areaId, days);
      return { areaId, reports };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load historical data";
      return rejectWithValue(msg);
    }
  }
);

export const submitReport = createAsyncThunk(
  "data/submitReport",
  async (
    reportData: Omit<Report, "id" | "created_at" | "confidence_score" | "device_id" | "expires_at">,
    { rejectWithValue, getState }
  ) => {
    try {
      // If the area is dynamically generated from location services (OSM/Search/GPS),
      // we must upsert it into the Supabase database first to satisfy the Foreign Key constraint.
      const state: any = getState();
      let activeArea = state.data.areas.find((a: Area) => a.id === reportData.area_id);
      
      if (activeArea && (activeArea.id.startsWith("osm-") || activeArea.id.startsWith("search-") || activeArea.id.startsWith("custom-") || activeArea.id.startsWith("live-"))) {
        activeArea = normalizeAreaToH3(activeArea);
        await dbService.saveCustomArea(activeArea);
        // Update the reportData to use the new H3 snapped area_id
        reportData = { ...reportData, area_id: activeArea.id };
      }

      const report = await dbService.createReport(reportData);
      return report;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit report";
      return rejectWithValue(msg);
    }
  }
);

export const confirmReportThunk = createAsyncThunk(
  "data/confirmReport",
  async (reportId: string, { rejectWithValue }) => {
    try {
      const count = await dbService.confirmReport(reportId);
      return { reportId, count };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to confirm report";
      return rejectWithValue(msg);
    }
  }
);

export const saveCustomAreaThunk = createAsyncThunk(
  "data/saveCustomArea",
  async (area: Area, { rejectWithValue, dispatch }) => {
    try {
      await dbService.saveCustomArea(area);
      return area;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save custom area";
      return rejectWithValue(msg);
    }
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    addLiveAreas: (state, action: PayloadAction<Area[]>) => {
      action.payload.forEach((newArea) => {
        const normalizedArea = normalizeAreaToH3(newArea);
        if (!state.areas.some(a => a.id === normalizedArea.id || a.name.toLowerCase().trim() === normalizedArea.name.toLowerCase().trim())) {
          state.areas.push(normalizedArea);
        }
      });
    },
    // Realtime action: update an area's current_status
    updateAreaStatus: (state, action: PayloadAction<{ id: string; current_status: string }>) => {
      const area = state.areas.find(a => a.id === action.payload.id);
      if (area) {
        area.current_status = action.payload.current_status as any;
      }
    },
    // Realtime action: insert or replace a report
    upsertReport: (state, action: PayloadAction<Report>) => {
      const idx = state.reports.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        const oldCreatedAt = new Date(state.reports[idx].created_at).getTime();
        const newCreatedAt = new Date(action.payload.created_at).getTime();
        if (oldCreatedAt > newCreatedAt) {
          action.payload.created_at = state.reports[idx].created_at;
        }
        state.reports[idx] = action.payload;
      } else {
        state.reports.unshift(action.payload);
      }
    },
    updateReportConfidence: (state, action: PayloadAction<{ id: string; newScore: number }>) => {
      const report = state.reports.find(r => r.id === action.payload.id);
      if (report) {
        report.confidence_score = action.payload.newScore;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.loading = false;
        
        // Preserve any custom or live areas that were added by geolocation before this fetch completed
        const dbAreas = action.payload.areas;
        const existingCustomAreas = state.areas.filter(a => a.id.startsWith("custom-") || a.id.startsWith("live-"));
        
        const newAreasMap = new Map();
        dbAreas.forEach(a => newAreasMap.set(a.id, a));
        existingCustomAreas.forEach(a => {
          if (!newAreasMap.has(a.id)) {
            newAreasMap.set(a.id, a);
          }
        });
        
        state.areas = Array.from(newAreasMap.values());
        
        // Re-process current status based on fetched reports
        state.areas.forEach(a => {
          a.current_status = getAreaStatusFromReports(a.id, action.payload.reports) as any;
        });

        state.reports = action.payload.reports;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHistoricalData.pending, (state) => {
        state.historicalLoading = true;
      })
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        state.historicalLoading = false;
        state.historicalReports[action.payload.areaId] = action.payload.reports;
      })
      .addCase(fetchHistoricalData.rejected, (state) => {
        state.historicalLoading = false;
      })
      .addCase(submitReport.fulfilled, (state, action: PayloadAction<Report>) => {
        const idx = state.reports.findIndex(r => r.id === action.payload.id);
        if (idx !== -1) {
          state.reports[idx].confidence_score = Math.max(state.reports[idx].confidence_score, action.payload.confidence_score);
          state.reports[idx].created_at = new Date().toISOString(); // Bump to now to update UI
        } else {
          state.reports.unshift(action.payload);
        }
      })
      
      .addCase(confirmReportThunk.fulfilled, (state, action) => {
        const confirmedReport = state.reports.find(r => r.id === action.payload.reportId);
        if (confirmedReport) {
          const wasConfirmed = confirmedReport.has_confirmed;
          confirmedReport.confidence_score = action.payload.count;
          confirmedReport.has_confirmed = true;
          confirmedReport.created_at = new Date().toISOString(); // Bump to now to update UI

          if (!wasConfirmed) {
            state.reports.forEach((r) => {
              if (
                r.id !== confirmedReport.id && 
                r.area_id === confirmedReport.area_id && 
                r.status === confirmedReport.status
              ) {
                r.confidence_score += 1;
                r.has_confirmed = true;
              }
            });
          }
        }
      })
      
      .addCase(saveCustomAreaThunk.fulfilled, (state, action) => {
        const existingArea = state.areas.find(a => a.id === action.payload.id);
        if (existingArea) {
          existingArea.name = action.payload.name;
          existingArea.slug = action.payload.slug;
        } else {
          state.areas.push(action.payload);
        }
      });
  }
});

export const { addLiveAreas, updateAreaStatus, upsertReport, updateReportConfidence } = dataSlice.actions;

export default dataSlice.reducer;
