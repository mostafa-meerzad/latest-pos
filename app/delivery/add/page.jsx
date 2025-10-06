"use client";
import { Suspense } from "react";
import AddDeliveryPage from "./AddDeliveryPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddDeliveryPage />
    </Suspense>
  );
}

// --- Create a new file: app/login/LoginForm.jsx ---
