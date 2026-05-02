import React, { useEffect, useRef, useState } from "react";
import { checkTrigger, analyzeEmotion } from "../services/api.js";

const EMOTION_COLORS = {
  Happy: "#F4A261", Neutral: "#94A3B8", Stress: "#E76F51",
  Drowsiness: "#8B7EC8", Sad: "#60A5FA", Angry: "#EF4444",
  Fear: "#A78BFA", Surprise: "#34D399", Disgust: "#6B7280",
};

export default function EmployeePortal() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const username = localStorage.getItem("username") || "Employee";

  const [cameraStatus, setCameraStatus] = useState("initializing");
  const [lastEmotion, setLastEmotion] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [flashColor, setFlashColor] = useState(null);
  const flashRef = useRef(null);

  // Start camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraStatus("ready");
      } catch {
        setCameraStatus("denied");
      }
    })();
    return () => {
      cancelled = true;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Poll for HR trigger every 3s
  useEffect(() => {
    if (cameraStatus !== "ready") return;
    const captureAndSend = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      canvas.width = 320; canvas.height = 240;
      canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const result = await analyzeEmotion(username, blob);
          if (result?.emotion) {
            setLastEmotion(result.emotion);
            setCaptureCount(c => c + 1);
            // Capture flash
            const hex = EMOTION_COLORS[result.emotion] || "#5B4FDB";
            setFlashColor(hex);
            if (flashRef.current) clearTimeout(flashRef.current);
            flashRef.current = setTimeout(() => setFlashColor(null), 1400);
          }
          canvas.getContext("2d").clearRect(0, 0, 320, 240);
        } catch {}
      }, "image/jpeg", 0.8);
    };

    const poll = async () => {
      try {
        const res = await checkTrigger();
        if (res?.capture_now) captureAndSend();
      } catch {}
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [cameraStatus, username]);

  const hex = lastEmotion ? (EMOTION_COLORS[lastEmotion] || "#5B4FDB") : "#5B4FDB";

  return (
    <>
      {/* Subtle screen edge glow on capture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none",
        boxShadow: flashColor ? `inset 0 0 70px 0 ${flashColor}66, inset 0 0 120px 0 ${flashColor}22` : "none",
        transition: "box-shadow .7s ease-out",
      }} />

      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Page */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F8FAFC", fontFamily: '"Inter", system-ui, sans-serif' }}>
        
        {/* Header */}
        <header style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#4F46E5,#3B82F6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>L</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Lumora</span>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = "/employee/login"; }}
            style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: "#64748B", fontWeight: 500 }}>
            Sign out
          </button>
        </header>

        {/* Hero */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{ textAlign: "center", maxWidth: 560 }}>
            {/* Ambient orb */}
            <div style={{ width: 160, height: 160, borderRadius: "50%", margin: "0 auto 32px", background: `radial-gradient(circle at 35% 35%, ${hex}44, ${hex}18 50%, transparent 75%)`, border: `2px solid ${hex}33`, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 4s ease-in-out infinite", transition: "background 1.5s ease-in-out", boxShadow: `0 0 60px ${hex}22` }}>
              {lastEmotion ? (
                <span style={{ fontSize: 16, fontWeight: 700, color: hex }}>{lastEmotion}</span>
              ) : (
                <svg width="36" height="36" fill="none" stroke={hex} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
              )}
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94A3B8" }}>EYEAI Workspace</p>
            <h1 style={{ margin: "0 0 12px", fontSize: 42, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Welcome, <span style={{ color: "#4F46E5" }}>{username}</span>
            </h1>
            <p style={{ margin: "0 0 32px", fontSize: 16, color: "#64748B", lineHeight: 1.6 }}>
              Keep this tab open. Your HR team will request a snapshot when analysis is needed.
            </p>

            {/* Status pill */}
            {cameraStatus === "initializing" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#F1F5F9", borderRadius: 99, fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94A3B8" }} />
                Connecting to camera…
              </span>
            )}
            {cameraStatus === "ready" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#DCFCE7", borderRadius: 99, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", animation: "pulse 2s infinite" }} />
                Monitoring active
                {captureCount > 0 && <span style={{ opacity: 0.7, fontWeight: 400, fontFamily: "monospace" }}>· {captureCount} sync{captureCount !== 1 ? "s" : ""}</span>}
              </span>
            )}
            {cameraStatus === "denied" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#FEF2F2", borderRadius: 99, fontSize: 13, color: "#991B1B", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                Camera access denied — check browser settings
              </span>
            )}

            {/* Live Camera Feed Integration */}
            {cameraStatus === "ready" && (
              <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
                <div style={{
                  width: "320px",
                  height: "240px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: `0 15px 35px -5px ${hex}33`,
                  border: `1px solid #E2E8F0`,
                  background: "#000",
                  transition: "box-shadow 1.5s ease-in-out"
                }}>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover", 
                      transform: "scaleX(-1)" 
                    }} 
                  />
                </div>
              </div>
            )}
            
          </div>
        </main>

        {/* Footer */}
        <footer style={{ padding: "16px 40px", borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>
            A brief glow at the screen edge marks each moment of analysis.
            Frames are processed in real time and immediately discarded — only emotion patterns are shared with HR.
          </p>
        </footer>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}`}</style>
    </>
  );
}