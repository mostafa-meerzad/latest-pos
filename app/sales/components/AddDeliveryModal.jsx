"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

// A helper function to get the current date in YYYY-MM-DD format
const getFormattedDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AddDeliveryModal({
  isOpen,
  onClose,
  saleId,
  customerId,
  onSuccess,
  sendDeliveryDetails,
}) {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  // const [deliveryDate, setDeliveryDate] = useState("");
  const [driverId, setDriverId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(getFormattedDate());

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
        } else {
          toast.error("Failed to load drivers.");
        }
      } catch (err) {
        console.error("Error fetching drivers:", err);
        toast.error("Error fetching drivers.");
      } finally {
        setIsLoadingDrivers(false);
      }
    }
    fetchDrivers();
  }, []);

  // ✅ Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!saleId || !customerId || !deliveryAddress) {
      return toast.error("Missing required sale/customer/delivery info.");
    }

    if (!selectedDriver) {
      return toast.error("Please select a driver.");
    }

    const afghanRegex = /^(\+93|0)?7\d{8}$/;
    if (!afghanRegex.test(customerPhone.trim())) {
      return toast.error(
        "Please enter a valid Afghan phone number (e.g. +93701234567 or 0701234567)."
      );
    }

    const fee = Number(deliveryFee);
    if (!Number.isInteger(fee) || fee < 0) {
      return toast.error("Delivery fee must be a non-negative whole number.");
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
        sendDeliveryDetails(data.data);
        onClose(); // Close modal on success
      } else {
        toast.error(
          data?.error?.message || data?.error || "Failed to create delivery."
        );
      }
    } catch (err) {
      console.error("Error creating delivery:", err);
      toast.error(err.message || "Network error while creating delivery.");
    } finally {
      setSubmitting(false);
    }
  }

  // ✅ Simple input restriction for Afghan phone format
  function handlePhoneChange(e) {
    let value = e.target.value.replace(/\s+/g, ""); // remove spaces

    // Allow only digits and an optional '+' at the start
    if (!/^\+?\d*$/.test(value)) return;

    // Limit max length: +93 + 9 digits = 12–13 chars
    if (value.length > 13) return;

    setCustomerPhone(value);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Delivery</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Delivery Address */}
          <div>
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

          {/* ✅ Customer Phone (fixed) */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Customer Phone
            </label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={handlePhoneChange}
              placeholder="+93 70 123 4567"
              required
            />
          </div>

          {/* Driver Selection */}
          <div>
            <label className="text-sm font-medium block mb-1">Driver</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 overflow-y-scroll max-h-32">
              {isLoadingDrivers
                ? deliverySkeleton.map((_, i) => (
                    <div
                      className="p-3 border rounded-md gap-2 flex flex-col"
                      key={i}
                    >
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[180px]" />
                    </div>
                  ))
                : drivers.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setDriverId(d.id);
                        setSelectedDriver(d);
                      }}
                      className={`p-3 border rounded-md cursor-pointer transition ${
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
              required={true}
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-end gap-2">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
