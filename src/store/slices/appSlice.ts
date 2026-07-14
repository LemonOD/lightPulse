import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  currentRegion: string;
  detectedAreaId: string | null;
  selectedAreaId: string | null;
  homeAreaId: string | null;
  searchQuery: string;
  isLocating: boolean;
  userLocation: [number, number] | null;
}

const initialState: AppState = {
  currentRegion: "",
  detectedAreaId: null,
  selectedAreaId: null, 
  homeAreaId: null,
  searchQuery: "",
  isLocating: false,
  userLocation: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setRegion: (state, action: PayloadAction<string>) => {
      state.currentRegion = action.payload;
    },
    setDetectedAreaId: (state, action: PayloadAction<string | null>) => {
      state.detectedAreaId = action.payload;
      if (action.payload) {
        state.selectedAreaId = action.payload; // Auto-focus on detected area
      }
    },
    setSelectedAreaId: (state, action: PayloadAction<string | null>) => {
      state.selectedAreaId = action.payload;
    },
    setHomeAreaId: (state, action: PayloadAction<string | null>) => {
      state.homeAreaId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsLocating: (state, action: PayloadAction<boolean>) => {
      state.isLocating = action.payload;
    },
    setUserLocation: (state, action: PayloadAction<[number, number] | null>) => {
      state.userLocation = action.payload;
    }
  }
});

export const {
  setRegion,
  setDetectedAreaId,
  setSelectedAreaId,
  setHomeAreaId,
  setSearchQuery,
  setIsLocating,
  setUserLocation
} = appSlice.actions;

export default appSlice.reducer;
