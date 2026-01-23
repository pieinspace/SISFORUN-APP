export function formatPace(paceMinPerKm: number) {
  if (!paceMinPerKm || paceMinPerKm <= 0) return "0:00";
  const totalSec = Math.round(paceMinPerKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
