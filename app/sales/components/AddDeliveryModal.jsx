"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddDeliveryModal({
  isOpen,
  onClose,
  saleId,
  customerId,
  onSuccess,
}) {
  const [drivers, setDrivers] = useState([]);
  const [driverQuery, setDriverQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] =
    useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [driverId, setDriverId] = useState("");

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const deliverySkeleton = ["", "", ""];

  // ✅ Fetch drivers on mount
  useEffect(() => {
    async function fetchDrivers() {
      setIsLoadingDrivers(true);
      try {
        const res = await fetch("/api/drivers");
        const data = await res.json();
        if (data.success) {
          setDrivers(data.data);
          setIsLoadingDrivers(false);
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
      }
    }
    fetchDrivers();
  }, []);

  // ✅ Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

  if (!saleId || !customerId  || !deliveryAddress) {
  return setError("Missing required sale/customer/delivery info.");
}

    if (!selectedDriver) {
      return setError("Please select a driver.");
    }

    const fee = Number(deliveryFee);
    if (!Number.isInteger(fee) || fee < 0) {
      return setError("Delivery fee must be a non-negative whole number.");
    }

    setSubmitting(true);
    try {
      const body = {
        saleId: parseInt(saleId, 10),
        customerId: parseInt(customerId, 10),
        deliveryAddress: deliveryAddress.trim(),
        driverId: selectedDriver.id,
        deliveryDate: deliveryDate || undefined,
        deliveryFee: fee,
        customerPhone: customerPhone.trim(),
      };

      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (onSuccess) onSuccess(data.data);
        onClose(); // Close modal on success
      } else {
        setError(
          data?.error?.message ||
            data?.error ||
            JSON.stringify(data?.error || data) ||
            "Failed to create delivery"
        );
      }
    } catch (err) {
      console.error("Error creating delivery:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Delivery</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Driver Selector */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium block mb-1">
              Delivery Address
            </label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter delivery address"
              required
            />
          </div>
          {/* Customer Phone */}
          <div className="col-span-2">
            <label className="text-sm font-medium block mb-1">
              Customer Phone
            </label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter customer phone number"
              required
            />
          </div>
          <div className="relative md:col-span-2">
            <label className="text-sm font-medium block mb-1">Driver</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {isLoadingDrivers
                ? deliverySkeleton.map((_, i) => (
                    <div
                      className="p-3 border rounded-md gap-2 flex flex-col"
                      key={i}
                    >
                      <Skeleton className={"h-4 w-[150px] "} />
                      <Skeleton className={"h-4 w-[180px]"} />
                    </div>
                  ))
                : drivers.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setDriverId(d.id);
                        setSelectedDriver(d);
                      }}
                      className={`p-3 border rounded-md cursor-pointer ${
                        driverId === d.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-gray-600">{d.phone}</p>
                    </div>
                  ))}
            </div>
          </div>

          {/* Delivery Fee */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Delivery Fee
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={deliveryFee}
              placeholder="Enter delivery fee"
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) setDeliveryFee(value);
              }}
              required
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Delivery Date
            </label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-red-600">{error && String(error)}</div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Delivery"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
