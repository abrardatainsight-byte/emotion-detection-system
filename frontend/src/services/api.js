/**
 * Centralised API client.
 *
 * In development (VITE_API_URL empty) requests hit the Vite proxy at /api
 * which forwards to http://127.0.0.1:8000.
 *
 * In production (VITE_API_URL=https://your-render-app.onrender.com)
 * requests go directly to Render — no proxy needed.
 */
const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "/api";

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// Auth
export const register = (data) =>
  req("/register", { method: "POST", body: JSON.stringify(data) });

export const login = (data) =>
  req("/login", { method: "POST", body: JSON.stringify(data) });

// Trigger
export const triggerCapture = () =>
  req("/trigger-capture", { method: "POST" });

export const checkTrigger = () => req("/check-trigger");

// HR analytics — all accept a range param
export const getGlobalPulse = (range = "week") =>
  req(`/hr/global-pulse?range=${range}`);

export const getDistribution = (range = "week") =>
  req(`/hr/distribution?range=${range}`);

export const getWeeklyTrend = () => req("/hr/weekly-trend");

export const getIntensity = () => req("/hr/intensity");

export const getResults = (range = "week") =>
  req(`/hr/results?range=${range}`);

export const getEmployees = (range = "week", search = "") =>
  req(`/hr/employees?range=${range}&search=${encodeURIComponent(search)}`);

export const getMatrix = (range = "week") =>
  req(`/hr/matrix?range=${range}`);

// Employee analyze — FormData, NOT JSON
export const analyzeEmotion = (username, blob) => {
  const form = new FormData();
  form.append("username", username);
  form.append("file", blob, "capture.jpg");
  return fetch(`${BASE}/analyze`, { method: "POST", body: form }).then((r) =>
    r.json()
  );
};

// Emotion colour map — 9 emotions
export const EMOTION_COLORS = {
  Happy:      "#F4A261",
  Neutral:    "#94A3B8",
  Stress:     "#E76F51",
  Drowsiness: "#8B7EC8",
  Sad:        "#60A5FA",
  Angry:      "#EF4444",
  Fear:       "#A78BFA",
  Surprise:   "#34D399",
  Disgust:    "#6B7280",
};

export const ALL_EMOTIONS = Object.keys(EMOTION_COLORS);

export function relativeTime(iso) {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}
