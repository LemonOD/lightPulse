export function getDeviceId(): string {
  // Safe for SSR
  if (typeof window === "undefined") {
    return "server-ssr-device";
  }

  const STORAGE_KEY = "lightpulse_device_id";
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}
