"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useAnimationControls } from "framer-motion";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

import DashboradImage from "@/assets/dashboard_bg.png";
import Logo from "@/assets/logo.png";
import ProductImg from "@/assets/product_img.png";
import SalesImg from "@/assets/sales_img.png";
import CustomerImg from "@/assets/customer_img.png";
import DeliveryImg from "@/assets/delivery_img.png";
import ReportsImg from "@/assets/reports_img.png";
import SettingsImg from "@/assets/settings_img.png";
import DriversImg from "@/assets/drivers_img.png";
import SuppliersImg from "@/assets/suppliers_img.png";
import { useEffect, useState } from "react";

// ✅ Optimized + Safe Motion Card
function AnimatedModuleCard({ m, delay }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // Prevents hydration mismatch

  return (
    <motion.div
      className={m.colSpan}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        whileHover={{
          scale: 1.04,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
        whileTap={{
          scale: 0.97,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        style={{
          transformPerspective: 800,
          willChange: "transform",
        }}
      >
        <Link href={m.href}>
          <Card className="cursor-pointer hover:shadow-lg transition rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-neutral-900/90">
            <CardContent className="flex flex-col items-center justify-center p-4">
              <motion.div
                whileHover={{ rotate: 6, scale: 1.1 }}
                whileTap={{ rotate: 4, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Image
                  src={m.src}
                  className="size-16 mb-3 select-none"
                  alt={m.alt}
                  width={100}
                  height={100}
                  priority
                />
              </motion.div>
              <span className={`font-bold text-xl ${m.textColor}`}>
                {m.name}
              </span>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  async function handleLogout() {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to logout");

      const data = await res.json();
      if (data.success) {
        toast.success("Logged out successfully!");
        setTimeout(() => (window.location.href = "/login"), 1000);
      } else {
        toast.error("Logout failed. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Network error while logging out.");
    }
  }

  const modules = [
    {
      name: "Sales",
      src: SalesImg,
      alt: "Sales",
      textColor: "text-[#3cc839]",
      href: "/sales",
      colSpan: "col-span-2 max-sm:col-span-2",
    },
    {
      name: "Products",
      src: ProductImg,
      alt: "Products",
      textColor: "text-[#F1AD00]",
      href: "/products",
      colSpan: "col-span-1",
    },
    {
      name: "Drivers",
      src: DriversImg,
      alt: "Drivers",
      textColor: "text-[#f4585d]",
      href: "/drivers",
      colSpan: "col-span-1",
    },
    {
      name: "Delivery",
      src: DeliveryImg,
      alt: "Delivery",
      textColor: "text-[#d839c1]",
      href: "/delivery",
      colSpan: "col-span-1",
    },
    {
      name: "Customers",
      src: CustomerImg,
      alt: "Customers",
      textColor: "text-[#b900f2]",
      href: "/customers",
      colSpan: "col-span-1",
    },
    {
      name: "Suppliers",
      src: SuppliersImg,
      alt: "Suppliers",
      textColor: "text-[#009df1]",
      href: "/suppliers",
      colSpan: "col-span-1",
    },
    {
      name: "Reports",
      src: ReportsImg,
      alt: "Reports",
      textColor: "text-red-500",
      href: "/reports",
      colSpan: "col-span-1",
    },
    {
      name: "Settings",
      src: SettingsImg,
      alt: "Settings",
      textColor: "text-emerald-500",
      href: "/settings",
      colSpan: "col-span-1",
    },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-800">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DashboradImage.src})` }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-6">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="flex justify-between mb-6">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image src={Logo} alt="Logo" className="w-9 h-9" />
              <span className="text-white text-2xl font-bold">Afghan Pets</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Logout
              </Button>
            </motion.div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
            {modules.map((m, i) => (
              <AnimatedModuleCard key={m.name} m={m} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
