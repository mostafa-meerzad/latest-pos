"use client";

import React, { forwardRef } from "react";

const Delivery = forwardRef(
  (
    { customer, address, deliveryDate, deliveryFee, saleId, phone, driver },
    ref
  ) => {
    // ✅ Format date and time (e.g., 2025/10/22 • 03:45 PM)
    const formattedDate = deliveryDate
      ? (() => {
          const date = new Date(deliveryDate);
          const formattedDay = date
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "/");
          const formattedTime = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          return `${formattedDay} • ${formattedTime}`;
        })()
      : "";

    return (
      <div
        ref={ref}
        className="p-3 text-[10pt] font-mono"
        style={{
          width: "80mm",
          margin: 0,
          padding: "10px",
        }}
      >
        <h2 className="text-center text-lg font-bold">Afghan Pets</h2>
        <p className="text-center text-xs mb-2">Delivery Slip</p>
        <p className="text-xs mb-1">Sale ID: {saleId}</p>
        <p className="text-xs mb-1">Customer: {customer?.name || "Walk-in"}</p>
        <p className="text-xs mb-1">Phone: {phone || "Not provided"}</p>
        <p className="text-xs mb-1">
          Address: {address || "No address provided"}
        </p>
        <p className="text-xs mb-2">Date: {formattedDate}</p>

        <div className="mt-3 border-t border-b py-2">
          <p className="text-xs mb-2">
            Driver ID: {driver?.id || "Not Provided"}
          </p>
          <p className="text-xs mb-2">
            Driver Name: {driver?.name || "Not Provided"}
          </p>

          <div className="flex justify-between text-xs">
            <span>Delivery Fee:</span>
            <span>AFN {deliveryFee?.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        <p className="text-center text-xs mt-4">
          Thank you for choosing our delivery service!
        </p>
        <p className="text-center text-[8pt] mt-4 text-gray-500 tracking-wide border-t pt-1">
  EasySale • Powered by Webistan
</p>

        {/* ✅ Correct print CSS syntax for Next.js */}
        <style jsx>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            html,
            body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

Delivery.displayName = "Delivery";

export default Delivery;
