"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import DashboradImage from "@/assets/dashboard_bg.png";
import LogoImage from "@/assets/logo.png";
import { useRouter } from "next/navigation";
import useSaleStore from "@/components/saleStore";

export default function CustomersPage() {
  const router = useRouter();
  const items = useSaleStore((s) => s.items);

  useEffect(() => {
    // If first item is added, navigate to purchase details
    if (items.length > 0) {
      router.push("/customer-screen/purchase-detail");
    }
  }, [items, router]);

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
      <Card className="relative z-10 max-w-3xl w-full h-[400] rounded-2xl border border-orange-500/70 bg-white/10 backdrop-blur-md text-center shadow-xl">
        <div className="flex justify-center -mt-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
            <Image
              src={LogoImage}
              alt="Logo"
              width={90}
              height={90}
              className="object-contain"
            />
          </div>
        </div>

        <CardContent className="pt-10">
          <h1 className="text-5xl font-extrabold text-white mb-15 tracking-wide">
            Welcome to Afghan Pets
          </h1>
          <p className="text-2xl   text-gray-200">Pet Food &amp; Supplies</p>
        </CardContent>
      </Card>
    </div>
  );
}
