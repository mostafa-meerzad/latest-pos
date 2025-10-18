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
