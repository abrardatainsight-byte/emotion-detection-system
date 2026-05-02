import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as apiRegister, login as apiLogin } from "../services/api.js";

export default function Login({ type: initialType }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(initialType || "employee");
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = { ...form, role };
      const data = isRegistering ? await apiRegister(payload) : await apiLogin(payload);
      localStorage.setItem("username", data.username || form.username);
      localStorage.setItem("role", data.role);
      navigate(data.role === "hr" ? "/hr/dashboard" : "/employee/portal");
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#EEF2FF 0%,#F8FAFC 50%,#FFF7ED 100%)", fontFamily: '"Inter",system-ui,sans-serif' }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,#4F46E5,#3B82F6)", borderRadius: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, boxShadow: "0 8px 24px rgba(79,70,229,.35)", marginBottom: 12 }}>L</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>Lumora</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>Organizational Emotion Intelligence</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04)" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: "#0F172A", textAlign: "center" }}>
            {isRegistering ? "Create account" : "Welcome back"}
          </h2>

          {/* Role toggle */}
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, marginBottom: 24, gap: 3 }}>
            {["employee", "hr"].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .15s", background: role === r ? "#fff" : "transparent", color: role === r ? "#0F172A" : "#64748B", boxShadow: role === r ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                {r === "hr" ? "HR Admin" : "Employee"}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#FEF2F2", color: "#991B1B", borderRadius: 10, marginBottom: 16, fontSize: 13, border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Username</label>
              <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border .15s" }} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px 0", background: loading ? "#94A3B8" : "linear-gradient(135deg,#4F46E5,#3B82F6)", color: "#fff", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, marginTop: 4, boxShadow: loading ? "none" : "0 4px 12px rgba(79,70,229,.35)", transition: "all .2s" }}>
              {loading ? "Please wait…" : isRegistering ? "Register" : "Login"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => setIsRegistering(!isRegistering)}
              style={{ background: "none", border: "none", color: "#4F46E5", cursor: "pointer", fontSize: 13, fontWeight: 500, textDecoration: "underline" }}>
              {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#CBD5E1" }}>
          Frames are analyzed in real time and immediately discarded.
        </p>
      </div>
    </div>
  );
}
