"use client";
import { useEffect } from "react";
import { useAppDispatch } from "@/store";
import { setSelectedAreaId } from "@/store/slices/appSlice";
import Home from "@/app/(home)/home/page";

export default function AreaClientWrapper({ areaId }: { areaId: string }) {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    if (areaId) {
      dispatch(setSelectedAreaId(areaId));
    }
  }, [areaId, dispatch]);

  return <Home />;
}
