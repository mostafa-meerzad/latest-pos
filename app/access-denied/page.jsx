"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 520, padding: 24, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: "#4b5563", marginBottom: 16 }}>
          You do not have permission to access this page.
        </p>
        
        <Button variant={"outline"} className={"bg-[#2563eb] text-white rounded-xl active:scale-90 "} onClick={()=>router.push("/home")}>Back to Dashboard</Button>
        {/* <a href="/home" className={"bg-[#2563eb] text-white "}>Go back home</a> */}
      </div>
    </div>
  );
}
