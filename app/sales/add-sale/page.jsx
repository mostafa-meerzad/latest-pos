"use client";
import { Suspense } from "react";
import AddSalePage from "./AddSaleClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddSalePage />
    </Suspense>
  );
}
