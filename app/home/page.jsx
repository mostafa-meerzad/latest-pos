"use client";

import { Card, CardContent } from "@/components/ui/card";

import { motion } from "framer-motion";
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


export default function DashboardPage() {
  const modules = [
    { name: "Products", src: ProductImg, alt: "Sales image", textColor: "text-[#F1AD00]", href: "/products", colSpan: "col-span-3 max-sm:col-span-2" },
    { name: "Sales", src: SalesImg, alt: "Sales image", textColor: "text-green-500", href: "/sales", colSpan: "col-span-1" },
    { name: "Customers", src: CustomerImg, alt: "Customers image", textColor: "text-purple-500", href: "/customers", colSpan: "col-span-1" },
    { name: "Delivery", src: DeliveryImg, alt: "Delivery image", textColor: "text-pink-500", href: "/delivery", colSpan: "col-span-1" },
    { name: "Reports", src: ReportsImg, alt: "Reports image", textColor: "text-red-500", href: "/reports", colSpan: "col-span-1" },
    { name: "Drivers", src: DriversImg, alt: "Drivers image", textColor: "text-[#e0333b]", href: "/drivers", colSpan: "col-span-1" },
    { name: "Settings", src: SettingsImg, alt: "Settings image", textColor: "text-emerald-500", href: "/settings", colSpan: "col-span-1" },
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
        <div className="flex items-center space-x-2 mb-6 ">
        <Image 
          src={Logo}
          className="w-9 h-9 text-orange-500"
          alt="AfghanPet logo"
          width={100}
          height={100}
        />
          <span className="text-white text-2xl font-bold">AfghanPet</span>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.name}
              className={`${m.colSpan}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={m.href}>
                <Card className="cursor-pointer hover:shadow-lg transition rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <Image src={m.src} className="size-16  mb-3" alt={m.alt} width={100} height={100}/>
                    <span className={`font-bold text-xl ${m.textColor}`}>{m.name}</span>
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
