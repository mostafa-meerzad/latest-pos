"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid credentials");
        return;
      }
      try {
        const url = new URL(callbackUrl, window.location.origin);
        if (url.origin === window.location.origin) {
          window.location.assign(url.href);
        } else {
          window.location.assign("/");
        }
      } catch {
        window.location.assign("/");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={onSubmit} style={{ width: 360, padding: 24, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Sign in</h1>
        {error ? (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 8, borderRadius: 6, marginBottom: 12 }}>{error}</div>
        ) : null}
        <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
          style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, marginBottom: 12 }}
        />
        <label style={{ display: "block", fontSize: 12, color: "#374151" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 6, marginTop: 4, marginBottom: 16 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10, background: "#111827", color: "white", border: 0, borderRadius: 6 }}>
          Sign in
        </button>
      </form>
    </div>
  );
}