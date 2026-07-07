"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function ProductSearch({
  products,
  selectedProduct,
  onSelect,
  quantity,
  setQuantity,
  itemDiscount,
  setItemDiscount,
  paymentMethod,
  setPaymentMethod,
  taxAmount,
  setTaxAmount,
  onAdd,
  openKeyboard,
  barcodeRef,
  isEditMode,
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [productQuery, setProductQuery] = useState(selectedProduct?.name || "");
  const [productSuggestionsVisible, setProductSuggestionsVisible] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const productSuggestions = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [productQuery, products]);

  // Barcode quick lookup
  useEffect(() => {
    if (!barcodeInput) return;
    const found = products.find((p) => p.barcode === barcodeInput.trim());
    if (found) {
      onSelect(found);
      setProductQuery(found.name);
    }
  }, [barcodeInput, products, onSelect]);

  function handleSelectProduct(p) {
    onSelect(p);
    setProductQuery(p.name);
    setBarcodeInput(p.barcode || "");
    setProductSuggestionsVisible(false);
  }

  function handleAdd() {
    onAdd();
    setProductQuery("");
    setBarcodeInput("");
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 mt-5">Add product</h3>
      <Input
        ref={barcodeRef}
        placeholder="Scan barcode"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && selectedProduct) {
            e.preventDefault();
            handleAdd();
          }
        }}
        className="mb-2"
      />
      <Input
        placeholder="Search product..."
        value={productQuery}
        onChange={(e) => { setProductQuery(e.target.value); setProductSuggestionsVisible(true); }}
        onFocus={() => setProductSuggestionsVisible(true)}
        onBlur={() => setTimeout(() => setProductSuggestionsVisible(false), 150)}
        className="mb-2"
      />

      {productSuggestionsVisible && productQuery && productSuggestions.length > 0 && (
        <div className="mb-2 max-h-48 overflow-y-scroll border rounded-md drop-shadow-xl bg-white">
          {productSuggestions.map((p) => (
            <div
              key={p.id}
              className="p-2 px-4 hover:bg-slate-100 cursor-pointer border-b"
              onMouseDown={() => handleSelectProduct(p)}
            >
              <div className="font-medium text-[1.12rem] mb-1">{p.name}</div>
              <div className="text-gray-900 font-bold text-[.79rem] flex gap-4">
                <span>
                  <span className="text-[.8rem] font-semibold text-gray-700">Stock: </span>
                  {p.stockQuantity}
                </span>
                <span>
                  <span className="text-[.8rem] font-semibold text-gray-700">Price: </span>
                  AFN {p.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center max-xl:flex-col">
        <div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-28">
              <label className="text-xs text-gray-600">Qty</label>
              <Input
                type="text"
                inputMode="decimal"
                min={0}
                step={selectedProduct?.unit === "kg" ? "0.1" : "1"}
                value={quantity === "" ? "" : quantity}
                placeholder="1"
                data-input-type="quantity"
                readOnly
                onPointerDown={() => {
                  openKeyboard("quantity");
                  if (quantity === 1) setQuantity("");
                }}
                onFocus={() => {
                  openKeyboard("quantity");
                  if (quantity === 1) setQuantity("");
                }}
                onBlur={() => { if (quantity === "") setQuantity(1); }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") { setQuantity(""); return; }
                  const num = Number(val);
                  if (num >= 0) {
                    if (selectedProduct?.unit === "pcs") {
                      if (Number.isInteger(num)) setQuantity(num);
                    } else {
                      setQuantity(num);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (selectedProduct?.unit === "pcs") {
                    if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                  } else {
                    if (["-", "e", "E"].includes(e.key)) e.preventDefault();
                  }
                }}
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-600">Discount</label>
              <Input
                type="number"
                step="1"
                min={0}
                value={itemDiscount}
                data-input-type="discount"
                readOnly
                inputMode="none"
                onPointerDown={() => openKeyboard("discount")}
                onFocus={() => openKeyboard("discount")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") { setItemDiscount(""); return; }
                  const num = Number(val);
                  if (num >= 0 && Number.isInteger(num)) setItemDiscount(val);
                }}
                onKeyDown={(e) => {
                  if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                }}
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="mt-3 text-sm text-gray-600">
              Selected: <strong>{selectedProduct.name}</strong> • AFN
              <strong> {selectedProduct.price}</strong>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <div className="w-28 relative">
              <label className="text-xs text-gray-600">Payment method</label>
              <div
                className="mt-1 p-2 border rounded bg-white cursor-pointer"
                onClick={() => setShowPaymentOptions(!showPaymentOptions)}
              >
                {paymentMethod ? (
                  <span className="text-sm">{paymentMethod}</span>
                ) : (
                  <span className="text-sm text-gray-400">Select method...</span>
                )}
              </div>
              {showPaymentOptions && (
                <div className="absolute z-10 mt-1 w-full max-h-36 overflow-auto border rounded bg-white shadow">
                  {["Cash", "Card", "Mobile", "Other"].map((method) => (
                    <div
                      key={method}
                      className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                      onMouseDown={() => {
                        setPaymentMethod(method);
                        setShowPaymentOptions(false);
                      }}
                    >
                      {method}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-32">
              <label className="text-xs text-gray-600">Tax amount</label>
              <Input
                type="number"
                step="1"
                min={0}
                value={taxAmount}
                data-input-type="tax"
                readOnly
                inputMode="none"
                onPointerDown={() => openKeyboard("tax")}
                onFocus={() => openKeyboard("tax")}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") { setTaxAmount(""); return; }
                  const num = Number(val);
                  if (num >= 0 && Number.isInteger(num)) setTaxAmount(val);
                }}
                onKeyDown={(e) => {
                  if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center gap-2 size-16 bg-green-500 hover:bg-green-600 rounded-md"
          >
            <Plus className="size-7 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
