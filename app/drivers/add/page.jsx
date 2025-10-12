"use client";
import { Suspense } from "react";
import CreateDriverPage from "./AddDriverPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateDriverPage />
    </Suspense>
  );
}

// --- Create a new file: app/login/LoginForm.jsx ---
