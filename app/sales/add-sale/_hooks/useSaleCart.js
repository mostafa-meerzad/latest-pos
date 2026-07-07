"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import useSaleStore from "@/lib/stores/saleStore";

function genTempId() {
  return `item-${crypto.randomUUID()}`;
}

export function useSaleCart() {
  const items = useSaleStore((s) => s.items);
  const addItem = useSaleStore((s) => s.addItem);
  const updateItem = useSaleStore((s) => s.updateItem);
  const deleteItem = useSaleStore((s) => s.deleteItem);
  const clear = useSaleStore((s) => s.clear);
  const addFinalizedSale = useSaleStore((s) => s.addFinalizedSale);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  const totals = useMemo(() => {
    const subtotal = Math.floor(
      items.reduce(
        (s, it) => s + Number(it.unitPrice || 0) * Number(it.quantity || 0),
        0
      )
    );
    const discount = Math.floor(
      items.reduce((s, it) => s + Number(it.discount || 0), 0)
    );
    const final = Math.floor(subtotal - discount);
    return { subtotal, discount, final };
  }, [items]);

  function onAddItem(selectedProduct, quantity, itemDiscount) {
    if (!selectedProduct)
      return toast.error("Select a product or scan a barcode first");
    if (!quantity || quantity <= 0)
      return toast.error("Quantity must be at least 1");

    const productUnit = selectedProduct.unit || "pcs";
    if (productUnit === "pcs" && !Number.isInteger(Number(quantity))) {
      return toast.error(
        "Quantity must be a whole number for items sold by piece (pcs)"
      );
    }

    const unitPrice = Number(selectedProduct.price || 0);
    const discount = Number(itemDiscount || 0);
    const subtotal = Math.floor(unitPrice * quantity - discount);

    addItem({
      tempId: genTempId(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      barcode: selectedProduct.barcode,
      unitPrice,
      quantity,
      discount,
      subtotal,
      expiryDate: selectedProduct.expiryDate || null,
      unit: productUnit,
    });

    toast.success(`${selectedProduct.name} added to cart`);
  }

  function startEdit(row) {
    setEditingId(row.tempId);
    setEditValues({ ...row });
  }

  function saveEdit() {
    if (!editingId || !editValues) return;

    const originalItem = items.find((item) => item.tempId === editingId);
    const productUnit = originalItem?.unit || "pcs";

    if (productUnit === "pcs" && !Number.isInteger(Number(editValues.quantity))) {
      return toast.error(
        "Quantity must be a whole number for items sold by piece (pcs)"
      );
    }

    updateItem(editingId, {
      ...editValues,
      subtotal: Math.floor(
        Number(editValues.unitPrice || 0) * Number(editValues.quantity || 0) -
          Number(editValues.discount || 0)
      ),
    });

    toast.success("Item updated");
    setEditingId(null);
    setEditValues(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  function populateFromSaleData(saleData, { clear: clearStore }) {
    clearStore();
    if (saleData.items && Array.isArray(saleData.items)) {
      saleData.items.forEach((item) => {
        if (item && item.product) {
          addItem({
            tempId: genTempId(),
            productId: item.productId,
            name: item.product.name,
            barcode: item.product.barcode,
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 0,
            discount: Number(item.discount) || 0,
            subtotal: Number(item.subtotal) || 0,
            expiryDate: item.product.expiryDate || null,
            unit: item.product.unit || "pcs",
          });
        }
      });
    }
  }

  return {
    items,
    clear,
    addFinalizedSale,
    editingId,
    editValues,
    setEditValues,
    totals,
    onAddItem,
    startEdit,
    saveEdit,
    cancelEdit,
    deleteItem,
    populateFromSaleData,
  };
}
