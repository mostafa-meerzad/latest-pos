"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
      alt: "Sales image",
      textColor: "text-[#3cc839]",
      href: "/sales",
      colSpan: "col-span-2 max-sm:col-span-2",
    },
    {
      name: "Products",
      src: ProductImg,
      alt: "Products image",
      textColor: "text-[#F1AD00]",
      href: "/products",
      colSpan: "col-span-1",
    },
    {
      name: "Drivers",
      src: DriversImg,
      alt: "Drivers image",
      textColor: "text-[#f4585d]",
      href: "/drivers",
      colSpan: "col-span-1",
    },
    {
      name: "Delivery",
      src: DeliveryImg,
      alt: "Delivery image",
      textColor: "text-[#d839c1]",
      href: "/delivery",
      colSpan: "col-span-1",
    },
    {
      name: "Customers",
      src: CustomerImg,
      alt: "Customers image",
      textColor: "text-[#b900f2]",
      href: "/customers",
      colSpan: "col-span-1",
    },
    {
      name: "Suppliers",
      src: SuppliersImg,
      alt: "Suppliers image",
      textColor: "text-[#009df1]",
      href: "/suppliers",
      colSpan: "col-span-1",
    },
    {
      name: "Reports",
      src: ReportsImg,
      alt: "Reports image",
      textColor: "text-red-500",
      href: "/reports",
      colSpan: "col-span-1",
    },
    {
      name: "Settings",
      src: SettingsImg,
      alt: "Settings image",
      textColor: "text-emerald-500",
      href: "/settings",
      colSpan: "col-span-1",
    },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-800">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DashboradImage.src})` }}
      ></div>

      {/* Centered content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-6">
        <div className="w-full max-w-5xl">
          {/* Logo */}
          <div className="flex justify-between mb-6 ">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src={Logo}
                className="w-9 h-9 text-orange-500"
                alt="Afghan Pets logo"
                width={100}
                height={100}
              />
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

          {/* Dashboard Grid */}
          <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
            {modules.map((m, i) => (
              <motion.div
                key={m.name}
                className={`${m.colSpan}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={m.href}>
                  <Card className="cursor-pointer hover:shadow-lg transition rounded-2xl bg-white hover:bg-white">
                    <CardContent className="flex flex-col items-center justify-center p-4">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Image
                          src={m.src}
                          className="size-16 mb-3"
                          alt={m.alt}
                          width={100}
                          height={100}
                        />
                      </motion.div>
                      <span
                        className={`font-bold text-xl ${m.textColor} drop-shadow-md`}
                      >
                        {m.name}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
