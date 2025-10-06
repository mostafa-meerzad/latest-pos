"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboradImage from "@/assets/dashboard_bg.png";
import logo from "@/assets/logo.png";
import { useRouter } from "next/navigation";

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleAdminClick = () => {
    router.push("/home");
  };

  const handleCustomerClick = () => {
    // Open in new window
    const newWindow = window.open(
      "/customer-screen",
      "_blank",
      "noopener,noreferrer,width=1200,height=800"
    );

    if (newWindow && newWindow.focus) {
      newWindow.focus();
    }
  };

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
      <Card className="relative z-10 max-w-3xl w-full h-[400px] rounded-2xl border border-orange-500/70 bg-white/10 backdrop-blur-md text-center shadow-xl">
        <div className="flex justify-center -mt-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
            <Image
              src={logo}
              alt="Logo"
              width={90}
              height={90}
              className="object-contain"
            />
          </div>
        </div>

        <CardContent className="pt-20">
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-wide">
            Welcome to AfghanPet
          </h1>
          <p className="text-2xl text-gray-200 mb-10">
            Pet Food &amp; Supplies
          </p>

          <div className="flex justify-center gap-6">
            <Button
              onClick={handleAdminClick}
              className="border-orange-500/70 bg-white/10 backdrop-blur-md text-center shadow-xl w-[150] h-[60] text-lg"
            >
              Admin
            </Button>
            <Button
              onClick={handleCustomerClick}
              className="border-orange-500/70 bg-white/10 backdrop-blur-md text-center shadow-xl w-[150] h-[60] text-lg"
            >
              Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
