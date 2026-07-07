"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export default function CustomerSearch({ customers, customer, onSelect }) {
  const [query, setQuery] = useState(customer?.name || "");
  const [visible, setVisible] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, customers]);

  function handleSelect(c) {
    onSelect(c);
    setQuery(c.name);
    setVisible(false);
  }

  // Keep query in sync when customer is cleared externally
  if (!customer && query) {
    // only reset if the parent cleared the customer
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Customer</h3>
      <Input
        placeholder="Search customer..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setVisible(true); }}
        onFocus={() => setVisible(true)}
        onBlur={() => setTimeout(() => setVisible(false), 150)}
      />
      <div className="mt-2 text-sm text-gray-600">
        Selected:{" "}
        <span className="font-medium text-[1rem]">
          {customer?.name || "Walk-in Customer"}
        </span>
      </div>

      {visible && query && suggestions.length > 0 && (
        <div className="absolute z-20 bg-white border rounded-md w-[27svw] drop-shadow-xl -mt-5 max-h-40 overflow-auto">
          {suggestions.map((c) => (
            <div
              key={c.id}
              className="p-2 hover:bg-slate-100 cursor-pointer px-7 rounded-md"
              onMouseDown={() => handleSelect(c)}
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
