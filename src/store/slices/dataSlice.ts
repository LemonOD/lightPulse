import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Area, Report, ReportStatus } from "@/lib/mockData";
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
    reportData: { area_id: string; area_name: string; status: ReportStatus; comment: string; user_id?: string },
    { rejectWithValue }
  ) => {
    try {
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

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {},
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
        state.reports.unshift(action.payload); // Add to beginning of timeline
      })
      
      // Confirm report
      .addCase(confirmReportThunk.fulfilled, (state, action) => {
        const report = state.reports.find(r => r.id === action.payload.reportId);
        if (report) {
          report.confirmations_count = action.payload.count;
          report.has_confirmed = true;
        }
      });
  }
});

export default dataSlice.reducer;
