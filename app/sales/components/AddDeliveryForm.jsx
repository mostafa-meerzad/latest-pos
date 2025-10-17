"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AddDeliveryForm({
  deliveryData,
  onChange,
  onSubmit,
  drivers = [],
  loadingDrivers = false,
  submitting = false,
  errors = {},
}) {
  const skeletons = ["", "", ""];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Add Delivery</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log("delivery form called: ")
          onSubmit();
        }}
      >
        <Card>
          <CardContent className="space-y-6">
            {/* Customer Phone */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Customer Phone
              </label>
              <Input
                value={deliveryData.customerPhone || ""}
                onChange={(e) => onChange("customerPhone", e.target.value)}
                placeholder="Enter customer phone number"
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.customerPhone}
                </p>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Delivery Address
              </label>
              <Input
                value={deliveryData.deliveryAddress || ""}
                onChange={(e) => onChange("deliveryAddress", e.target.value)}
                placeholder="Enter delivery address"
              />
              {errors.deliveryAddress && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.deliveryAddress}
                </p>
              )}
            </div>

            {/* Drivers */}
            <div>
              <label className="text-sm font-medium block mb-1">
                Select Driver
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {loadingDrivers
                  ? skeletons.map((_, i) => (
                      <div
                        key={i}
                        className="p-3 border rounded-md flex flex-col gap-2"
                      >
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[180px]" />
                      </div>
                    ))
                  : drivers.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => onChange("driverId", d.id)}
                        className={`p-3 border rounded-md cursor-pointer ${
                          deliveryData.driverId === d.id
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

            {/* Fee & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Delivery Fee
                </label>
                <Input
                  inputMode="numeric"
                  value={deliveryData.deliveryFee || ""}
                  onChange={(e) => onChange("deliveryFee", e.target.value)}
                  placeholder="Enter delivery fee"
                />
                {errors.deliveryFee && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.deliveryFee}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Delivery Date
                </label>
                <Input
                  type="date"
                  value={deliveryData.deliveryDate || ""}
                  onChange={(e) => onChange("deliveryDate", e.target.value)}
                />
                {errors.deliveryDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.deliveryDate}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                className="bg-orange-500"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Delivery"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
