"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast"; // ✅ added Toaster
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateDriverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      toast.error("Name and phone are required.");
      return;
    }

    if (!/^[0-9]+$/.test(phone.trim())) {
      setError("Phone number must contain only digits.");
      toast.error("Phone number must contain only digits.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating driver...");

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Driver created successfully!");
        if (from === "drivers") {
          router.push("/drivers");
        } else {
          router.push("/delivery");
        }
      } else {
        const message = data?.error || "Failed to create driver.";
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error("Error creating driver:", err);
      const message = err.message || "Network error.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
      toast.dismiss(toastId);
    }
  }

  function handlePhoneChange(e) {
    let value = e.target.value.replace(/\s+/g, "");
    if (!/^\+?\d*$/.test(value)) return;
    if (value.length > 13) return;
    setPhone(value);
  }

  return (
    <div className="p-6 flex flex-col justify-center items-center">
      {/* <div className="flex mb-4"> */}
        <h1 className="text-3xl font-bold">Add Delivery Driver</h1>
    
      {/* </div> */}

      <div className="flex justify-center mt-24">
        <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Driver Name
                  </label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      error ? "Name is required" : "Enter driver name"
                    }
                    className={error ? "border-red-500" : ""}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+93 70 123 4567"
                    required
                  />
                </div>
              </div>

              {/* form actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  type="submit"
                  className="bg-orange-400 hover:bg-orange-500 text-white"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Create Driver"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    router.push(from === "drivers" ? "/drivers" : "/delivery")
                  }
                >
                  Cancel
                </Button>

                {error && (
                  <div className="ml-4 text-sm text-red-600">
                    {error !== "Name and phone are required." && String(error)}
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

// "use client";

// import React, { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { toast } from "react-hot-toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";

// export default function CreateDriverPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const from = searchParams.get("from");

//   // form state
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   // const [phone, setphone] = useState("");

//   // UI state
//   const [error, setError] = useState(null);
//   const [submitting, setSubmitting] = useState(false);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setError(null);

//     if (!name.trim() || !phone.trim()) {
//       setError("Name and phone are required.");
//       toast.error("Name and phone are required.");
//       return;
//     }

//     if (!/^[0-9]+$/.test(phone.trim())) {
//       setError("Phone number must contain only digits.");
//       toast.error("Phone number must contain only digits.");
//       return;
//     }

//     setSubmitting(true);
//     const toastId = toast.loading("Creating driver...");

//     try {
//       const res = await fetch("/api/drivers", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
//       });

//       const data = await res.json();
//       if (res.ok && data.success) {
//         toast.success("Driver created successfully!");
//         if (from === "drivers") {
//           router.push("/drivers");
//         } else {
//           router.push("/delivery");
//         }
//       } else {
//         const message = data?.error || "Failed to create driver.";
//         setError(message);
//         toast.error(message);
//       }
//     } catch (err) {
//       console.error("Error creating driver:", err);
//       const message = err.message || "Network error.";
//       setError(message);
//       toast.error(message);
//     } finally {
//       setSubmitting(false);
//       toast.dismiss(toastId);
//     }
//   }

//   // ✅ Simple input restriction for Afghan phone format
//   function handlePhoneChange(e) {
//     let value = e.target.value.replace(/\s+/g, ""); // remove spaces

//     // Allow only digits and an optional '+' at the start
//     if (!/^\+?\d*$/.test(value)) return;

//     // Limit max length: +93 + 9 digits = 12–13 chars
//     if (value.length > 13) return;

//     setPhone(value);
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-3xl font-bold">Add Delivery Driver</h1>
//         <Link href="/drivers">
//           <Button variant="outline">Back to Drivers</Button>
//         </Link>
//       </div>

//       <div className="flex justify-center mt-24">
//         <form onSubmit={handleSubmit} className="min-w-4xl drop-shadow-2xl">
//           <Card>
//             <CardContent>
//               <div className="grid grid-cols-1 gap-4">
//                 {/* Name */}
//                 <div>
//                   <label className="text-sm font-medium block mb-1">
//                     Driver Name
//                   </label>
//                   <Input
//                     required
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     placeholder={
//                       error ? "Name is required" : "Enter driver name"
//                     }
//                     className={error ? "border-red-500" : ""}
//                   />
//                 </div>

//                 <div>
//                   <label className="text-sm font-medium block mb-1">
//                     Phone
//                   </label>
//                   <Input
//                     type="tel"
//                     value={phone}
//                     onChange={handlePhoneChange}
//                     placeholder="+93 70 123 4567"
//                     required
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
//                   {submitting ? "Saving..." : "Create Driver"}
//                 </Button>
//                 <Button
//                   variant="ghost"
//                   onClick={() =>
//                     router.push(from === "drivers" ? "/drivers" : "/delivery")
//                   }
//                 >
//                   Cancel
//                 </Button>

//                 {error && (
//                   <div className="ml-4 text-sm text-red-600">
//                     {error !== "Name and phone are required." && String(error)}
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
