"use client";

import React, { forwardRef } from "react";

const NewInvoice = forwardRef(({ sale }, ref) => {
  if (!sale) return null;

  const formattedDate = sale.date
    ? new Date(sale.date).toISOString().split("T")[0].replace(/-/g, "/")
    : "";

  const subtotal = sale.items.reduce((acc, i) => acc + i.subtotal, 0);
  const discount = sale.discountAmount || 0;
  const tax = sale.taxAmount || 0;
  const total = sale.totalAmount || subtotal - discount + tax;

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
      <p className="text-center text-xs mb-2">Invoice #{sale.invoice?.invoiceNumber || sale.id}</p>
      <p className="text-xs">Customer: {sale.customer?.name || "Walk-in"}</p>
      {sale.customer?.phone && <p className="text-xs mb-1">Phone: {sale.customer.phone}</p>}
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
          {sale.items.map((it) => (
            <tr key={it.id}>
              <td>{it.product?.name}</td>
              <td className="text-right">{it.quantity} {it.product.unit === "pcs" ? " pcs " : it.product.unit === "kg" ? " kg " : ""} </td>
              <td className="text-right">AFN {it.unitPrice?.toFixed(2) || it.price?.toFixed(2)}</td>
              <td className="text-right">AFN {it.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>AFN {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Tax:</span>
          <span>+AFN {tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Discount:</span>
          <span>-AFN {discount}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>AFN {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment:</span>
          <span>{sale.paymentMethod}</span>
        </div>
      </div>

      {sale.delivery && (
        <div className="mt-3 text-xs">
          <p><strong>Delivery:</strong> {sale.delivery.deliveryAddress}</p>
          <p><strong>Delivery Fee:</strong> AFG {sale.delivery.deliveryFee}</p>
          <p>Driver: {sale.delivery.driver?.name}</p>
        </div>
      )}

      <p className="text-center text-xs mt-4">Thank you for shopping!</p>

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

NewInvoice.displayName = "Invoice";

export default NewInvoice;
