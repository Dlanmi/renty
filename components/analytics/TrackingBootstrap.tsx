"use client";

import { useEffect } from "react";
import { ensureAnalyticsIdentity } from "@/lib/analytics/identity";

export default function TrackingBootstrap() {
  useEffect(() => {
    ensureAnalyticsIdentity();
  }, []);

  return null;
}
