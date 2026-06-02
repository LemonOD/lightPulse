"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import { fetchInitialData } from "./slices/dataSlice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Automatically trigger initial database sync on client load
    store.dispatch(fetchInitialData());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
