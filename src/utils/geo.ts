export type LatLng = { latitude: number; longitude: number };

export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLon = deg2rad(b.longitude - a.longitude);

  const lat1 = deg2rad(a.latitude);
  const lat2 = deg2rad(b.latitude);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatPace(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return "0:00";
  const totalSeconds = Math.round(minPerKm * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
