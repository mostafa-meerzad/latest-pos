"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function AddDeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // form state
  const [saleId, setSaleId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [driverId, setDriverId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // delivery fee field
  const [deliveryFee, setDeliveryFee] = useState("");
  // customer phone field
  const [customerPhone, setCustomerPhone] = useState("");
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

  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const deliverySkeleton = ["", "", ""];
  const from = searchParams.get("from"); // "sales" or "deliveries"

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
          `#${foundSale.id} – ${foundSale.customer?.name} – ${foundSale.totalAmount}AFG`
        );

        setCustomerId(foundSale.customerId);
        if (foundSale.deliveryAddress) {
          setDeliveryAddress(foundSale.deliveryAddress);
        }
        if (foundSale.customer?.phone)
          setCustomerPhone(foundSale.customer.phone);
      }
    }
  }, [searchParams, sales]);

  // fetch sales & drivers once
  useEffect(() => {
    async function fetchData() {
      setIsLoadingDrivers(true);
      try {
        const saleRes = await fetch("/api/sale");
        const saleData = await saleRes.json();
        if (saleData.success) setSales(saleData.data);

        const driverRes = await fetch("/api/drivers");
        const driverData = await driverRes.json();
        if (driverData.success) {
          setDrivers(driverData.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to fetch sales or drivers data");
      } finally {
        setIsLoadingDrivers(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!saleId || !customerId || !deliveryAddress) {
      const msg = "Sale, Customer, and Delivery Address are required.";
      toast.error(msg);
      return setError(msg);
    }

    const fee = Number(deliveryFee);
    if (!Number.isInteger(fee) || fee < 0) {
      const msg = "Delivery fee must be a non-negative whole number.";
      toast.error(msg);
      return setError(msg);
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Creating delivery...");

    try {
      const body = {
        saleId: parseInt(saleId, 10),
        customerId: parseInt(customerId, 10),
        deliveryAddress: deliveryAddress.trim(),
        driverId: driverId ? parseInt(driverId, 10) : undefined,
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
        toast.success("Delivery created successfully!", { id: loadingToast });

        // Smart redirect
        if (from === "deliveries") {
          router.push("/delivery");
        } else {
          router.push("/sales/add-sale");
        }
      } else {
        const msg =
          data?.error?.message ||
          data?.error ||
          JSON.stringify(data?.error || data) ||
          "Failed to create delivery";
        setError(msg);
        toast.error(msg, { id: loadingToast });
      }
    } catch (err) {
      console.error("Error creating delivery:", err);
      const msg = err.message || "Network error";
      setError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      toast.dismiss(loadingToast);
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Add Delivery</h1>
      </div>
      <div className="flex justify-center drop-shadow-2xl ">
        <form onSubmit={handleSubmit} className="min-w-3xl relative">
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
                      {selectedSale.customer?.name} – {selectedSale.totalAmount}
                      AFG
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
                                `#${s.id} – ${s.customer?.name} – ${s.totalAmount}AFG`
                              );
                              setSaleSuggestionsVisible(false);
                            }}
                          >
                            #{s.id} – {s.customer?.name} –{" "}
                            {new Date(s.date).toLocaleDateString()} –{" "}
                            {s.totalAmount}AFG
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Customer Phone */}
                <div className="col-span-2">
                  <label className="text-sm font-medium block mb-1">
                    Customer Phone
                  </label>
                  <Input
                    value={customerPhone}
                    type={"tel"}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter customer phone number"
                    required
                  />
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

                {/* Drivers */}
                <div className="relative md:col-span-2">
                  <label className="text-sm font-medium block mb-1">
                    Driver
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    router.push(
                      `${
                        from === "deliveries" ? "/delivery" : "/sales/add-sale"
                      }`
                    )
                  }
                >
                  Cancel
                </Button>

                {error && (
                  <div className="ml-4 text-sm text-red-600">
                    {String(error)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------

// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function AddDeliveryPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // form state
//   const [saleId, setSaleId] = useState("");
//   const [customerId, setCustomerId] = useState("");
//   const [deliveryAddress, setDeliveryAddress] = useState("");
//   const [driverId, setDriverId] = useState("");
//   const [deliveryDate, setDeliveryDate] = useState("");

//   // delivery fee field
//   const [deliveryFee, setDeliveryFee] = useState("");
//   // customer phone field
//   const [customerPhone, setCustomerPhone] = useState("");
//   // data
//   const [sales, setSales] = useState([]);
//   const [drivers, setDrivers] = useState([]);

//   // UI state
//   const [error, setError] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   // suggestions states
//   const [saleQuery, setSaleQuery] = useState("");
//   const [saleSuggestionsVisible, setSaleSuggestionsVisible] = useState(false);
//   const [selectedSale, setSelectedSale] = useState(null);

//   const [driverQuery, setDriverQuery] = useState("");
//   const [driverSuggestionsVisible, setDriverSuggestionsVisible] =
//     useState(false);
//   const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);

//   const [selectedDriver, setSelectedDriver] = useState(null);

//   const deliverySkeleton = ["", "", ""];
//   const from = searchParams.get("from"); // "sales" or "deliveries"
//   // Prefill SaleId from query
//   useEffect(() => {
//     const saleIdFromQuery = searchParams.get("saleId");
//     if (saleIdFromQuery) {
//       setSaleId(saleIdFromQuery);

//       const foundSale = sales.find(
//         (s) => s.id === parseInt(saleIdFromQuery, 10)
//       );
//       if (foundSale) {
//         setSelectedSale(foundSale);
//         setSaleQuery(
//           `#${foundSale.id} – ${foundSale.customer?.name} – ${foundSale.totalAmount}AFG`
//         );

//         // ✅ ensure customerId and deliveryAddress are filled
//         setCustomerId(foundSale.customerId);
//         if (foundSale.deliveryAddress) {
//           setDeliveryAddress(foundSale.deliveryAddress);
//         }
//         if (foundSale.customer?.phone)
//           setCustomerPhone(foundSale.customer.phone);
//       }
//     }
//   }, [searchParams, sales]);

//   // fetch sales & drivers once
//   useEffect(() => {
//     async function fetchData() {
//       setIsLoadingDrivers(true);
//       try {
//         const saleRes = await fetch("/api/sale");
//         const saleData = await saleRes.json();
//         if (saleData.success) setSales(saleData.data);

//         const driverRes = await fetch("/api/drivers");
//         const driverData = await driverRes.json();
//         if (driverData.success) {
//           setDrivers(driverData.data);
//           setIsLoadingDrivers(false);
//         }
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       }
//     }
//     fetchData();
//   }, []);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError(null);

//     if (!saleId || !customerId || !deliveryAddress) {
//       return setError("Sale, Customer, and Delivery Address are required.");
//     }
//     // Validate delivery fee
//     const fee = Number(deliveryFee);
//     if (!Number.isInteger(fee) || fee < 0) {
//       return setError("Delivery fee must be a non-negative whole number.");
//     }

//     setSubmitting(true);

//     try {
//       const body = {
//         saleId: parseInt(saleId, 10),
//         customerId: parseInt(customerId, 10),
//         deliveryAddress: deliveryAddress.trim(),
//         driverId: driverId ? parseInt(driverId, 10) : undefined,
//         deliveryDate: deliveryDate || undefined,
//         deliveryFee: fee,
//         customerPhone: customerPhone.trim(),
//       };

//       const res = await fetch("/api/deliveries", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });

//       const data = await res.json();

//       if (res.ok && data.success) {
//         // 🔥 Smart redirect
//         if (from === "deliveries") {
//           router.push("/delivery");
//         } else {
//           // Default or "sales"
//           router.push("/sales/add-sale");
//         }
//       } else {
//         const msg =
//           data?.error?.message ||
//           data?.error ||
//           JSON.stringify(data?.error || data) ||
//           "Failed to create delivery";
//         setError(msg);
//       }
//     } catch (err) {
//       console.error("Error creating delivery:", err);
//       setError(err.message || "Network error");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-3xl font-bold">Add Delivery</h1>
//         {/* <div className="flex gap-2">
//           <Link href="/delivery">
//             <Button variant="outline" className={"drop-shadow-2xl"}>
//               Back to Deliveries
//             </Button>
//           </Link>
//           <Link href="/sales/add-sale">
//             <Button
//               variant="outline"
//               className={"drop-shadow-2xl bg-[#3ec83f] text-white"}
//             >
//               Back to Sales
//             </Button>
//           </Link>
//         </div> */}
//       </div>
//       <div className="flex justify-center drop-shadow-2xl ">
//         <form onSubmit={handleSubmit} className="min-w-3xl relative">
//           <Card>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Sale Selector */}
//                 <div className="relative md:col-span-2">
//                   <label className="text-sm font-medium block mb-1">Sale</label>
//                   <Input
//                     placeholder="Search by customer name, sale ID, or amount..."
//                     value={saleQuery}
//                     onChange={(e) => {
//                       setSaleQuery(e.target.value);
//                       setSaleSuggestionsVisible(true);
//                     }}
//                     onFocus={() => setSaleSuggestionsVisible(true)}
//                     onBlur={() =>
//                       setTimeout(() => setSaleSuggestionsVisible(false), 150)
//                     }
//                   />
//                   {selectedSale && (
//                     <div className="mt-2 text-sm text-gray-600">
//                       Selected Sale: #{selectedSale.id} –{" "}
//                       {selectedSale.customer?.name} – {selectedSale.totalAmount}
//                       AFG
//                     </div>
//                   )}
//                   {saleSuggestionsVisible && saleQuery && (
//                     <div className="absolute z-20 bg-white border rounded w-full mt-1 max-h-40 overflow-auto">
//                       {sales
//                         .filter(
//                           (s) =>
//                             s.id.toString().includes(saleQuery) ||
//                             s.customer?.name
//                               ?.toLowerCase()
//                               .includes(saleQuery.toLowerCase()) ||
//                             s.totalAmount?.toString().includes(saleQuery)
//                         )
//                         .map((s) => (
//                           <div
//                             key={s.id}
//                             className="p-2 hover:bg-slate-50 cursor-pointer"
//                             onMouseDown={() => {
//                               setSelectedSale(s);
//                               setSaleId(s.id);
//                               setCustomerId(s.customerId);
//                               setSaleQuery(
//                                 `#${s.id} – ${s.customer?.name} – ${s.totalAmount}AFG`
//                               );
//                               setSaleSuggestionsVisible(false);
//                             }}
//                           >
//                             #{s.id} – {s.customer?.name} –{" "}
//                             {new Date(s.date).toLocaleDateString()} –{" "}
//                             {s.totalAmount}AFG
//                           </div>
//                         ))}
//                     </div>
//                   )}
//                 </div>

//                 {/* Customer Phone */}
//                 <div className="col-span-2">
//                   <label className="text-sm font-medium block mb-1">
//                     Customer Phone
//                   </label>
//                   <Input
//                     value={customerPhone}
//                     onChange={(e) => setCustomerPhone(e.target.value)}
//                     placeholder="Enter customer phone number"
//                     required
//                   />
//                 </div>

//                 {/* Delivery Address */}
//                 <div className="md:col-span-2">
//                   <label className="text-sm font-medium block mb-1">
//                     Delivery Address
//                   </label>
//                   <Input
//                     value={deliveryAddress}
//                     onChange={(e) => setDeliveryAddress(e.target.value)}
//                     placeholder="Enter delivery address"
//                     required
//                   />
//                 </div>

//                 <div className="relative md:col-span-2">
//                   <label className="text-sm font-medium block mb-1">
//                     Driver
//                   </label>
//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//                     {isLoadingDrivers
//                       ? deliverySkeleton.map((_, i) => (
//                           <div
//                             className="p-3 border rounded-md gap-2 flex flex-col"
//                             key={i}
//                           >
//                             <Skeleton className={"h-4 w-[150px] "} />
//                             <Skeleton className={"h-4 w-[180px]"} />
//                           </div>
//                         ))
//                       : drivers.map((d) => (
//                           <div
//                             key={d.id}
//                             onClick={() => {
//                               setDriverId(d.id);
//                               setSelectedDriver(d);
//                             }}
//                             className={`p-3 border rounded-md cursor-pointer ${
//                               driverId === d.id
//                                 ? "border-orange-500 bg-orange-50"
//                                 : "border-gray-300 hover:bg-gray-50"
//                             }`}
//                           >
//                             <p className="font-medium">{d.name}</p>
//                             <p className="text-sm text-gray-600">{d.phone}</p>
//                           </div>
//                         ))}
//                   </div>
//                 </div>

//                 {/* ✅ Delivery Fee */}
//                 <div>
//                   <label className="text-sm font-medium block mb-1">
//                     Delivery Fee
//                   </label>
//                   <Input
//                     type="text"
//                     inputMode="numeric"
//                     value={deliveryFee}
//                     placeholder="Enter delivery fee"
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       // only digits allowed, no negatives or decimals
//                       if (/^\d*$/.test(value)) setDeliveryFee(value);
//                     }}
//                     required
//                   />
//                 </div>

//                 {/* Delivery Date */}
//                 <div>
//                   <label className="text-sm font-medium block mb-1">
//                     Delivery Date
//                   </label>
//                   <Input
//                     type="date"
//                     value={deliveryDate}
//                     onChange={(e) => setDeliveryDate(e.target.value)}
//                   />
//                 </div>
//               </div>

//               {/* form actions */}
//               <div className="mt-6 flex items-center gap-3">
//                 <Button
//                   type="submit"
//                   className="bg-orange-500"
//                   disabled={submitting}
//                 >
//                   {submitting ? "Saving..." : "Create Delivery"}
//                 </Button>
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   onClick={() =>
//                     router.push(
//                       `${
//                         from === "deliveries" ? "/delivery" : "/sales/add-sale"
//                       }`
//                     )
//                   }
//                 >
//                   Cancel
//                 </Button>

//                 {error && (
//                   <div className="ml-4 text-sm text-red-600">
//                     {String(error)}
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </form>
//       </div>
//     </div>
//   );
// }
