"use client";

import React, { forwardRef } from "react";

const Invoice = forwardRef(({ items, customer, totals, saleId, date }, ref) => {

  // ✅ Format date to YYYY/MM/DD
  const formattedDate = date
    ? new Date(date).toISOString().split("T")[0].replace(/-/g, "/")
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
      <p className="text-center text-xs mb-2">Invoice #{saleId}</p>
      <p className="text-xs">Customer: {customer?.name || "Walk-in"}</p>
      <p className="text-xs mb-2">Date: {formattedDate}</p>

      <table className="w-full border-t border-b text-xs my-2">
        <thead>
          <tr className="border-b">
            <th className="text-left">Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.tempId}>
              <td>{it.name}</td>
              <td className="text-right">{it.quantity}</td>
              <td className="text-right">AFN {it.unitPrice.toFixed(2)}</td>
              <td className="text-right">AFN {it.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>AFN {totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Discount:</span>
          <span>-AFN {totals.discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>AFN {totals.final.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-center text-xs mt-4">Thank you for shopping!</p>

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
});

Invoice.displayName = "Invoice";

export default Invoice;
