"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";


export default function AddDeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // form state
  const [saleId, setSaleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [driverId, setDriverId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // data
  const [sales, setSales] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // suggestions states
  const [saleQuery, setSaleQuery] = useState("");
  const [saleSuggestionsVisible, setSaleSuggestionsVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [driverQuery, setDriverQuery] = useState("");
  const [driverSuggestionsVisible, setDriverSuggestionsVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Prefill SaleId from query
useEffect(() => {
  const saleIdFromQuery = searchParams.get("saleId");
  if (saleIdFromQuery) {
    setSaleId(saleIdFromQuery);

    const foundSale = sales.find(
      (s) => s.id === parseInt(saleIdFromQuery, 10)
    );
    if (foundSale) {
      setSelectedSale(foundSale);
      setSaleQuery(
        `#${foundSale.id} – ${foundSale.customer?.name} – ${foundSale.totalAmount}$`
      );

      // ✅ ensure customerId and deliveryAddress are filled
      setCustomerId(foundSale.customerId);
      if (foundSale.deliveryAddress) {
        setDeliveryAddress(foundSale.deliveryAddress);
      }
    }
  }
}, [searchParams, sales]);


  // fetch sales & drivers once
  useEffect(() => {
    async function fetchData() {
      try {
        const saleRes = await fetch("/api/sale");
        const saleData = await saleRes.json();
        if (saleData.success) setSales(saleData.data);

        const driverRes = await fetch("/api/drivers");
        const driverData = await driverRes.json();
        if (driverData.success) setDrivers(driverData.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!saleId || !customerId || !deliveryAddress) {
      return setError("Sale, Customer, and Delivery Address are required.");
    }

    setSubmitting(true);
    try {
      const body = {
        saleId: parseInt(saleId, 10),
        customerId: parseInt(customerId, 10),
        deliveryAddress: deliveryAddress.trim(),
        driverId: driverId ? parseInt(driverId, 10) : undefined,
        deliveryDate: deliveryDate || undefined,
      };

      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/delivery");
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create delivery";
        setError(msg);
      }
    } catch (err) {
      console.error("Error creating delivery:", err);
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Delivery</h1>
        <Link href="/delivery">
          <Button variant="outline">Back to Deliveries</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl relative">
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sale Selector */}
              <div className="relative md:col-span-2">
                <label className="text-sm font-medium block mb-1">Sale</label>
                <Input
                  placeholder="Search by customer name, sale ID, or amount..."
                  value={saleQuery}
                  onChange={(e) => {
                    setSaleQuery(e.target.value);
                    setSaleSuggestionsVisible(true);
                  }}
                  onFocus={() => setSaleSuggestionsVisible(true)}
                  onBlur={() =>
                    setTimeout(() => setSaleSuggestionsVisible(false), 150)
                  }
                />
                {selectedSale && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected Sale: #{selectedSale.id} –{" "}
                    {selectedSale.customer?.name} – {selectedSale.totalAmount}$
                  </div>
                )}
                {saleSuggestionsVisible && saleQuery && (
                  <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto">
                    {sales
                      .filter(
                        (s) =>
                          s.id.toString().includes(saleQuery) ||
                          s.customer?.name
                            ?.toLowerCase()
                            .includes(saleQuery.toLowerCase()) ||
                          s.totalAmount?.toString().includes(saleQuery)
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          className="p-2 hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setSelectedSale(s);
                            setSaleId(s.id);
                            setCustomerId(s.customerId);
                            setSaleQuery(
                              `#${s.id} – ${s.customer?.name} – ${s.totalAmount}$`
                            );
                            setSaleSuggestionsVisible(false);
                          }}
                        >
                          #{s.id} – {s.customer?.name} –{" "}
                          {new Date(s.date).toLocaleDateString()} –{" "}
                          {s.totalAmount}$
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Delivery Address */}
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

              {/* Driver Selector */}
              <div className="relative md:col-span-2">
                <label className="text-sm font-medium block mb-1">Driver</label>
                <Input
                  placeholder="Search driver by name..."
                  value={driverQuery}
                  onChange={(e) => {
                    setDriverQuery(e.target.value);
                    setDriverSuggestionsVisible(true);
                  }}
                  onFocus={() => setDriverSuggestionsVisible(true)}
                  onBlur={() =>
                    setTimeout(() => setDriverSuggestionsVisible(false), 150)
                  }
                />
                {selectedDriver && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected Driver: {selectedDriver.name} –{" "}
                    {selectedDriver.phone}
                  </div>
                )}
                {driverSuggestionsVisible && driverQuery && (
                  <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto">
                    {drivers
                      .filter((d) =>
                        d.name
                          .toLowerCase()
                          .includes(driverQuery.toLowerCase())
                      )
                      .map((d) => (
                        <div
                          key={d.id}
                          className="p-2 hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setSelectedDriver(d);
                            setDriverId(d.id);
                            setDriverQuery(`${d.name} – ${d.phone}`);
                            setDriverSuggestionsVisible(false);
                          }}
                        >
                          {d.name} – {d.phone}
                        </div>
                      ))}
                  </div>
                )}
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
            </div>

            {/* form actions */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                type="submit"
                className="bg-orange-500"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Delivery"}
              </Button>
              <Button variant="ghost" onClick={() => router.push("/deliveries")}>
                Cancel
              </Button>
              
              {error && (
                <div className="ml-4 text-sm text-red-600">{String(error)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
