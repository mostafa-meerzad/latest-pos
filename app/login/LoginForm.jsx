"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import DashboradImage from "@/assets/dashboard_bg.png";
import logo from "@/assets/logo.png";

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
    <div className="relative flex h-screen w-full items-center justify-center">
      {/* Background image */}
      <Image
        src={DashboradImage}
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0" />

      {/* Content */}
      <Card className="relative z-10 max-w-md w-full rounded-2xl border border-orange-500/70 bg-white/10 backdrop-blur-md text-center shadow-xl p-8">
        <div className="flex justify-center -mt-16 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
            <Image
              src={logo}
              alt="Logo"
              width={90}
              height={90}
              className="object-contain"
            />
          </div>
        </div>

        <CardContent>
          <h1 className="text-3xl font-extrabold text-white mb-6 tracking-wide">
            Welcome Back
          </h1>
          <p className="text-gray-200 mb-8">Please sign in to continue</p>

          <form onSubmit={onSubmit} className="space-y-4 text-left">
            {error && (
              <div className="bg-red-200 text-red-800 p-2 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-200 mb-1">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full p-2 rounded-md border border-gray-300 bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 rounded-md border border-gray-300 bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 h-13 bg-orange-500/80 hover:bg-orange-600 text-white font-semibold py-2 text-lg rounded-lg  backdrop-blur-md"
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
