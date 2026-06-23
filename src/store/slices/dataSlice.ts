import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Area, Report, ReportStatus } from "@/lib/types";
import { dbService } from "@/lib/db";

interface DataState {
  areas: Area[];
  reports: Report[];
  loading: boolean;
  error: string | null;
}

const initialState: DataState = {
  areas: [],
  reports: [],
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
      const activeArea = state.data.areas.find((a: Area) => a.id === reportData.area_id);
      
      if (activeArea && (activeArea.id.startsWith("osm-") || activeArea.id.startsWith("search-") || activeArea.id.startsWith("custom-"))) {
        await dbService.saveCustomArea(activeArea);
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
      // We don't need to add it again if it's already in liveAreas, but we update its name
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
        if (!state.areas.some(a => a.id === newArea.id)) {
          state.areas.push(newArea);
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
        state.reports[idx] = action.payload;
      } else {
        state.reports.unshift(action.payload);
      }
    },
    // Realtime action: update confidence score
    updateReportConfidence: (state, action: PayloadAction<{ id: string; newScore: number }>) => {
      const report = state.reports.find(r => r.id === action.payload.id);
      if (report) {
        report.confidence_score = action.payload.newScore;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch initial data
      .addCase(fetchInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.areas = action.payload.areas;
        state.reports = action.payload.reports;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Submit report
      .addCase(submitReport.fulfilled, (state, action: PayloadAction<Report>) => {
        // Prevent duplicate if the realtime hook already injected it
        const exists = state.reports.some(r => r.id === action.payload.id);
        if (!exists) {
          state.reports.unshift(action.payload);
        }
      })
      
      // Confirm report
      .addCase(confirmReportThunk.fulfilled, (state, action) => {
        const confirmedReport = state.reports.find(r => r.id === action.payload.reportId);
        if (confirmedReport) {
          const wasConfirmed = confirmedReport.has_confirmed;
          confirmedReport.confidence_score = action.payload.count;
          confirmedReport.has_confirmed = true;

          // If this is a fresh confirmation click, synchronize all matching local reports
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
      
      // Save custom area
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
