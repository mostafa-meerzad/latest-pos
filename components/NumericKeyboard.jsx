"use client";

import { useState, useRef, useCallback } from "react";
import { X, GripHorizontal } from "lucide-react";

const INPUT_LABELS = {
  quantity: "Qty",
  discount: "Discount",
  tax: "Tax",
  unitPrice: "Unit Price",
  editQuantity: "Qty (row)",
  editDiscount: "Discount (row)",
};

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "backspace"],
];

export default function NumericKeyboard({ onInput, activeInput, onClose }) {
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(0, window.innerWidth - 300) : 100,
    y: typeof window !== "undefined" ? Math.max(0, window.innerHeight - 440) : 100,
  }));

  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback(
    (e) => {
      dragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos]
  );

  const onDragMove = useCallback((e) => {
    if (!dragging.current) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 268, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y)),
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragging.current = false;
  }, []);

  const label = activeInput ? (INPUT_LABELS[activeInput] ?? activeInput) : "Numpad";

  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 9999, touchAction: "none" }}
      className="rounded-2xl bg-white shadow-2xl border border-gray-200 select-none w-[268px] overflow-hidden"
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-200 cursor-grab active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <GripHorizontal className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 active:bg-gray-300 text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Keys */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {KEYS.flat().map((key, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onInput(key);
            }}
            className={`h-[68px] rounded-xl text-xl font-semibold flex items-center justify-center transition-all active:scale-95 ${
              key === "backspace"
                ? "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 border border-red-200"
                : "bg-gray-50 text-gray-800 hover:bg-gray-100 active:bg-gray-200 border border-gray-200"
            }`}
          >
            {key === "backspace" ? "⌫" : key}
          </button>
        ))}

        {/* Clear — full width */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onInput("clear");
          }}
          className="col-span-3 h-12 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 transition-all active:scale-95"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
