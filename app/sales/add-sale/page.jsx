"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { Plus, Trash2, Edit, Save } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import salesImage from "@/assets/sales_img.png";
import useSaleStore from "@/components/saleStore";
import { useReactToPrint } from "react-to-print";
import Invoice from "@/components/Invoice";
import AddDeliveryModal from "../components/AddDeliveryModal";
import { date } from "zod";
import dynamic from "next/dynamic";
const NumericKeyboard = dynamic(() => import("@/components/NumericKeyboard"), {
  ssr: false,
});
import Delivery from "@/components/Delivery";
import { motion } from "framer-motion";

export default function AddSalePage() {
  // store actions
  const items = useSaleStore((s) => s.items);
  const addItem = useSaleStore((s) => s.addItem);
  const updateItem = useSaleStore((s) => s.updateItem);
  const deleteItem = useSaleStore((s) => s.deleteItem);
  const clear = useSaleStore((s) => s.clear);
  const addFinalizedSale = useSaleStore((s) => s.addFinalizedSale);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestionsVisible, setCustomerSuggestionsVisible] =
    useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productSuggestionsVisible, setProductSuggestionsVisible] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [taxAmount, setTaxAmount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPrintedSale, setLastPrintedSale] = useState(null);
  const [lastPrintedDelivery, setLastPrintedDelivery] = useState(null);
  const [saleData, setSaleData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const invoiceRef = useRef(null);
  const deliveryRef = useRef(null);
  const barcodeRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 🔹 EDIT MODE STATE AND EFFECTS
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSaleId, setEditSaleId] = useState(null);
  const [originalSaleData, setOriginalSaleData] = useState(null);
  const [hasFetchedEditData, setHasFetchedEditData] = useState(false);

  // 🔹 COMPLETE RESET FUNCTION - Handles all scenarios
  const resetAllStates = useCallback(() => {
    console.log("Resetting all states to normal...");

    // Reset edit mode
    setIsEditMode(false);
    setEditSaleId(null);
    setOriginalSaleData(null);
    setHasFetchedEditData(false);

    // Reset form states
    setCustomer(null);
    setCustomerQuery("");
    setProductQuery("");
    setBarcodeInput("");
    setQuantity(1);
    setItemDiscount(0);
    setPaymentMethod("Cash");
    setTaxAmount(0);
    setEditingId(null);
    setEditValues(null);
    setSelectedProduct(null);
    setShowPaymentOptions(false);

    // Clear cart
    clear();

    // Refocus barcode input for new sales
    setTimeout(() => {
      if (barcodeRef.current) {
        barcodeRef.current.focus();
      }
    }, 100);
  }, [clear]);

  // 🔹 Check for edit mode in URL
  useEffect(() => {
    const edit = searchParams.get("edit");
    const id = searchParams.get("id");

    if (edit === "true" && id) {
      console.log("Entering edit mode for sale:", id);
      setIsEditMode(true);
      setEditSaleId(id);
      setHasFetchedEditData(false);
    } else {
      
        resetAllStates();
     
    }
  }, [searchParams, isEditMode, resetAllStates]); // Use searchParams as dependency

  // 🔹 RESET ON ROUTE CHANGE - This handles ALL navigation scenarios
  useEffect(() => {
    // This effect runs when the pathname or search params change
    const currentParams = new URLSearchParams(window.location.search);
    const edit = currentParams.get("edit");
    const id = currentParams.get("id");

    // If we're NOT in edit mode anymore but our state thinks we are, reset
    if (!edit && !id && isEditMode) {
      console.log("Route changed away from edit mode, resetting states...");
      resetAllStates();
    }

    // If we're on a completely different page, reset
    if (!pathname.includes("/sales/add-sale") && isEditMode) {
      console.log("Left add-sale page, resetting states...");
      resetAllStates();
    }
  }, [pathname, searchParams, isEditMode, resetAllStates]);

  // 🔹 Reset edit mode function
  const resetEditMode = useCallback(() => {
    flushSync(() => {
      setIsEditMode(false);
      setEditSaleId(null);
      setOriginalSaleData(null);
      setHasFetchedEditData(false);
    });
  }, []);

  // 🔹 Fetch sale data for editing
  const fetchSaleData = useCallback(
    async (saleId) => {
      if (!saleId || hasFetchedEditData) return;

      const loadingToast = toast.loading("Loading sale data...");
      try {
        console.log("Fetching sale data for:", saleId);
        const res = await fetch(`/api/sale/editSale/${saleId}`);
        const data = await res.json();

        if (data.success) {
          setOriginalSaleData(data.data);
          setHasFetchedEditData(true);
          populateFormWithSaleData(data.data);
          toast.success("Sale loaded for editing", { id: loadingToast });
        } else {
          toast.error("Failed to fetch sale data", { id: loadingToast });
          resetAllStates();
        }
      } catch (error) {
        console.error("Error fetching sale data:", error);
        toast.error("Error loading sale for editing", { id: loadingToast });
        resetAllStates();
      }
    },
    [hasFetchedEditData, resetAllStates]
  );

  // 🔹 Trigger fetch when edit mode is active
  useEffect(() => {
    const edit = searchParams.get("edit");
    const id = searchParams.get("id");

    if (edit === "true" && id && !hasFetchedEditData) {
      fetchSaleData(id);
    }
  }, [searchParams, hasFetchedEditData, fetchSaleData]);

  // 🔹 Populate form with existing sale data
  const populateFormWithSaleData = useCallback(
    (saleData) => {
      console.log("Populating form with sale data:", saleData);

      // Clear current cart first
      clear();

      // Reset all form states
      setCustomerQuery("");
      setProductQuery("");
      setBarcodeInput("");
      setQuantity(1);
      setItemDiscount(0);
      setEditingId(null);
      setEditValues(null);

      // Set customer with null check
      if (saleData.customer) {
        setCustomer(saleData.customer);
        setCustomerQuery(saleData.customer.name || "");
      } else {
        setCustomer(null);
        setCustomerQuery("");
      }

      // Set payment method and tax with fallbacks
      setPaymentMethod(saleData.paymentMethod || "Cash");
      setTaxAmount(Number(saleData.taxAmount) || 0);

      // Add items to cart with proper error handling
      if (saleData.items && Array.isArray(saleData.items)) {
        saleData.items.forEach((item) => {
          if (item && item.product) {
            const cartItem = {
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
            };
            addItem(cartItem);
          }
        });
      }

      // Refocus barcode input after a short delay
      setTimeout(() => {
        if (barcodeRef.current) {
          barcodeRef.current.focus();
        }
      }, 100);
    },
    [clear, addItem]
  );

  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: invoiceRef });
  const handlePrintDelivery = useReactToPrint({ contentRef: deliveryRef });

  const handleDeliverySuccess = (delivery) => {
    // First, trigger sale invoice print
    triggerInvoicePrint(saleData);

    // Then after a delay, trigger delivery print
    setTimeout(() => {
      triggerDeliveryPrint(delivery);
    }, 1000); // 1 second delay to ensure sale invoice prints first

    toast.success("Delivery successfully created!");
    setSaleData({});
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSaleData({});
  };

  // fetch customers
  useEffect(() => {
    let isMounted = true;

    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customer/");
        const data = await res.json();
        if (data.success && isMounted) setCustomers(data.data);
      } catch (err) {
        toast.error("Failed to fetch customers");
      }
    }
    fetchCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  // fetch products
  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        const res = await fetch("/api/products/");
        const data = await res.json();

        if (data.success && isMounted) {
          const filtered = data.data.filter(
            (p) => p.status === "ACTIVE" && !p.isDeleted && p.stockQuantity > 0
          );
          setProducts(filtered);
        }
      } catch (err) {
        toast.error("Failed to fetch products");
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [isEditMode]); // Refetch when edit mode changes

  // focus barcode input
  useEffect(() => {
    if (barcodeRef.current && !isEditMode) {
      barcodeRef.current.focus();
    }
  }, [isEditMode]);

  // auto print when ready
  useEffect(() => {
    if (lastPrintedSale && invoiceRef.current) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastPrintedSale]);

  useEffect(() => {
    if (lastPrintedDelivery && deliveryRef.current) {
      const timer = setTimeout(() => {
        handlePrintDelivery();
      }, 800); // Increased delay to ensure sale invoice prints first
      return () => clearTimeout(timer);
    }
  }, [lastPrintedDelivery]);

  const productSuggestions = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [productQuery, products]);

  const customerSuggestions = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customerQuery, customers]);

  // barcode quick lookup
  useEffect(() => {
    if (!barcodeInput) return;
    const f = products.find((p) => p.barcode === barcodeInput.trim());
    if (f) {
      setSelectedProduct(f);
      setProductQuery(f.name);
    }
  }, [barcodeInput, products]);

  function genTempId() {
    return `item-${crypto.randomUUID()}`;
  }

  function onAdd() {
    if (!selectedProduct)
      return toast.error("Select a product or scan a barcode first");
    if (!quantity || quantity <= 0)
      return toast.error("Quantity must be at least 1");

    // Get the product unit and validate quantity based on unit type
    const productUnit = selectedProduct.unit || "pcs";

    if (productUnit === "pcs") {
      // For pcs, quantity must be integer
      if (!Number.isInteger(Number(quantity))) {
        return toast.error(
          "Quantity must be a whole number for items sold by piece (pcs)"
        );
      }
    }
    // For kg, decimal values are allowed

    const unitPrice = Number(selectedProduct.price || 0);
    const discount = Number(itemDiscount || 0);
    const subtotal = Math.floor(unitPrice * quantity - discount);

    const item = {
      tempId: genTempId(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      barcode: selectedProduct.barcode,
      unitPrice,
      quantity,
      discount,
      subtotal: subtotal,
      expiryDate: selectedProduct.expiryDate || null,
      unit: productUnit,
    };

    addItem(item);
    toast.success(`${selectedProduct.name} added to cart`);
    setProductQuery("");
    setSelectedProduct(null);
    setBarcodeInput("");
    setQuantity(1);
    setItemDiscount(0);
  }

  function startEdit(row) {
    setEditingId(row.tempId);
    setEditValues({ ...row });
  }

  function saveEdit() {
    if (!editingId || !editValues) return;

    // Find the original item to get the unit
    const originalItem = items.find((item) => item.tempId === editingId);
    const productUnit = originalItem?.unit || "pcs";

    // Validate quantity based on unit type
    if (productUnit === "pcs") {
      if (!Number.isInteger(Number(editValues.quantity))) {
        return toast.error(
          "Quantity must be a whole number for items sold by piece (pcs)"
        );
      }
    }

    const updated = {
      ...editValues,
      subtotal: Math.floor(
        Number(editValues.unitPrice || 0) * Number(editValues.quantity || 0) -
          Number(editValues.discount || 0)
      ),
    };
    updateItem(editingId, updated);
    toast.success("Item updated");
    setEditingId(null);
    setEditValues(null);
  }

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

  function triggerInvoicePrint(saleData) {
    setLastPrintedSale(saleData);
  }

  function triggerDeliveryPrint(deliveryData) {
    setLastPrintedDelivery(deliveryData);
  }

  async function handleFinalizeSale() {
    if (items.length === 0) return toast.error("No items to finalize");
    if (isSubmitting) return;

    const payload = {
      customerId: customer?.id ?? 1,
      paymentMethod: paymentMethod || "cash",
      taxAmount: Math.floor(Number(taxAmount || 0)),
      items: items.map((it) => ({
        productId: it.productId,
        quantity:
          it.unit === "kg"
            ? Number(it.quantity)
            : Math.floor(Number(it.quantity)), // Preserve decimals for kg, integer for pcs
        unitPrice: Math.floor(Number(it.unitPrice)),
        discount: Math.floor(Number(it.discount || 0)),
        subtotal: Math.floor(Number(it.subtotal)),
      })),
      totalAmount: Math.floor(totals.final + Number(taxAmount || 0)),
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEditMode && editSaleId) {
        // Use PUT for editing
        res = await fetch(`/api/sale/editSale/${editSaleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Use POST for new sale
        res = await fetch("/api/sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data?.error || `Failed to ${isEditMode ? "update" : "create"} sale`
        );
        return;
      }

      const serverSale = data.data || {};
      const finalized = {
        saleId: serverSale.id,
        date: serverSale.createdAt || new Date().toISOString(),
        customer: customer ?? { id: 0, name: "Walk-in Customer" },
        items: [...items],
        totals: { ...totals },
      };

      triggerInvoicePrint(finalized);

      const localSale = {
        id: finalized.saleId ?? Date.now(),
        customer: finalized.customer,
        items: finalized.items,
        total: payload.totalAmount,
        date: finalized.date,
        serverSale,
      };

      if (!isEditMode) {
        addFinalizedSale(localSale);
      }

      clear();
      setCustomer(null);
      setCustomerQuery("");
      setPaymentMethod("Cash");
      setTaxAmount(0);

      toast.success(
        `Sale ${isEditMode ? "updated" : "finalized"} successfully!`
      );

      if (isEditMode) {
        resetEditMode();
        router.push("/sales");
      }
    } catch (err) {
      console.error("Finalize sale error:", err);
      toast.error("Network or unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinalizeSaleWithDelivery() {
    if (items.length === 0) return toast.error("No items to finalize");
    if (isSubmitting) return;

    const payload = {
      customerId: customer?.id ?? 1,
      paymentMethod: paymentMethod || "cash",
      taxAmount: Math.floor(Number(taxAmount || 0)),
      items: items.map((it) => ({
        productId: it.productId,
        quantity:
          it.unit === "kg"
            ? Number(it.quantity)
            : Math.floor(Number(it.quantity)), // Preserve decimals for kg, integer for pcs
        unitPrice: Math.floor(Number(it.unitPrice)),
        discount: Math.floor(Number(it.discount || 0)),
        subtotal: Math.floor(Number(it.subtotal)),
      })),
      totalAmount: Math.floor(totals.final + Number(taxAmount || 0)),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data?.error || "Failed to create sale");
        return;
      }

      const serverSale = data.data || {};
      const finalized = {
        saleId: serverSale.id,
        date: serverSale.createdAt || new Date().toISOString(),
        customer: customer ?? { id: 0, name: "Walk-in Customer" },
        items: [...items],
        totals: { ...totals },
      };

      setSaleData(finalized);

      const localSale = {
        id: finalized.saleId ?? Date.now(),
        customer: finalized.customer,
        items: finalized.items,
        total: payload.totalAmount,
        date: finalized.date,
        serverSale,
      };
      addFinalizedSale(localSale);

      setTimeout(() => {
        clear();
        setCustomer(null);
        setCustomerQuery("");
        setPaymentMethod("cash");
        setTaxAmount(0);
        toast.success("Sale saved — now add delivery info");
        setIsModalOpen(true);
      }, 800);
    } catch (err) {
      console.error("Finalize sale + delivery error:", err);
      toast.error("Network or unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyboardInput(value) {
    if (!activeInput) return;

    // Handle clear or delete
    // if (value === "clear") {
    //   if (activeInput === "quantity") setQuantity("");
    //   if (activeInput === "discount") setItemDiscount("");
    //   if (activeInput === "tax") setTaxAmount("");
    //   if (activeInput === "unitPrice" && editValues)
    //     setEditValues((prev) => ({ ...prev, unitPrice: "" }));
    //   if (activeInput === "editQuantity" && editValues)
    //     setEditValues((prev) => ({ ...prev, quantity: "" }));
    //   if (activeInput === "editDiscount" && editValues)
    //     setEditValues((prev) => ({ ...prev, discount: "" }));
    //   return;
    // }

    if (value === "backspace") {
      if (activeInput === "quantity")
        setQuantity((prev) => String(prev).slice(0, -1) || "");
      if (activeInput === "discount")
        setItemDiscount((prev) => String(prev).slice(0, -1) || "");
      if (activeInput === "tax")
        setTaxAmount((prev) => String(prev).slice(0, -1) || "");
      if (activeInput === "unitPrice" && editValues)
        setEditValues((prev) => ({
          ...prev,
          unitPrice: String(prev.unitPrice || "").slice(0, -1) || "",
        }));
      if (activeInput === "editQuantity" && editValues)
        setEditValues((prev) => ({
          ...prev,
          quantity: String(prev.quantity || "").slice(0, -1) || "",
        }));
      if (activeInput === "editDiscount" && editValues)
        setEditValues((prev) => ({
          ...prev,
          discount: String(prev.discount || "").slice(0, -1) || "",
        }));
      return;
    }

    // Handle decimal point for kg items
    if (value === ".") {
      const isKgItem =
        (activeInput === "quantity" && selectedProduct?.unit === "kg") ||
        (activeInput === "editQuantity" && editValues?.unit === "kg");

      if (isKgItem) {
        if (activeInput === "quantity") {
          const current = String(quantity || "0");
          if (!current.includes(".")) {
            setQuantity(current === "0" ? "0." : current + ".");
          }
        }
        if (activeInput === "editQuantity" && editValues) {
          const current = String(editValues.quantity || "0");
          if (!current.includes(".")) {
            setEditValues((prev) => ({
              ...prev,
              quantity: current === "0" ? "0." : current + ".",
            }));
          }
        }
      }
      return;
    }

    // Append digits (only integers)
    if (/^\d$/.test(value)) {
      if (activeInput === "quantity") {
        const current = String(quantity || "0");
        // If current value is "0" or "0.", replace it appropriately
        if (current === "0") {
          setQuantity(value);
        } else if (current === "0.") {
          setQuantity(current + value);
        } else {
          setQuantity(current + value);
        }
      }
      if (activeInput === "discount")
        setItemDiscount((prev) => (prev ? prev + value : value));
      if (activeInput === "tax")
        setTaxAmount((prev) => (prev ? prev + value : value));
      if (activeInput === "unitPrice" && editValues)
        setEditValues((prev) => ({
          ...prev,
          unitPrice: prev.unitPrice ? String(prev.unitPrice) + value : value,
        }));
      if (activeInput === "editQuantity" && editValues)
        setEditValues((prev) => ({
          ...prev,
          quantity: prev.quantity ? String(prev.quantity) + value : value,
        }));
      if (activeInput === "editDiscount" && editValues)
        setEditValues((prev) => ({
          ...prev,
          discount: prev.discount ? String(prev.discount) + value : value,
        }));
    }
  }

  // Update keyboard position when active input changes
  useEffect(() => {
    if (activeInput && keyboardVisible) {
      const inputElement = document.querySelector(
        `[data-input-type="${activeInput}"]`
      );
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft =
          window.pageXOffset || document.documentElement.scrollLeft;

        const keyboardHeight = 250; // approximate height of the keypad
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let top;
        if (spaceBelow < keyboardHeight && spaceAbove > keyboardHeight) {
          // Not enough space below → place above input
          top = rect.top + scrollTop - keyboardHeight - 10;
        } else {
          // Default: place below input
          top = rect.bottom + scrollTop + 10;
        }

        let left = rect.left + scrollLeft;
        // Prevent going off right edge
        const maxLeft = window.innerWidth - 300; // assuming keypad width ~300px
        if (left > maxLeft) left = maxLeft;

        setKeyboardPosition({ top, left });
      }
    }
  }, [activeInput, keyboardVisible]);

  // Add click outside handler (updated)
  useEffect(() => {
    function handleClickOutside(event) {
      if (!keyboardVisible || !keyboardRef.current) return;

      const clickedInsideKeyboard = keyboardRef.current.contains(event.target);
      const clickedNumericInput = event.target.closest("[data-input-type]");

      // If clicking a different numeric input, just switch focus — don't close
      if (clickedNumericInput) {
        const newType = clickedNumericInput.getAttribute("data-input-type");
        if (newType !== activeInput) {
          setActiveInput(newType);
        }
        return;
      }

      // If clicked outside keyboard and not numeric input → close
      if (!clickedInsideKeyboard) {
        setKeyboardVisible(false);
        setActiveInput(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [keyboardVisible, activeInput]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2 w-fit text-nowrap">
          <Image src={salesImage} width={80} height={80} alt="sales" />
          {isEditMode ? `Edit Sale #${editSaleId}` : "New Sale"}
        </h1>

        <div className="flex gap-2 max-2xl:flex-wrap max-2xl:justify-end">
          <Button
            variant="secondary"
            className={"bg-red-500 text-white text-md hover:bg-red-400"}
            onClick={() => {
              if (confirm("Clear cart?")) clear();
            }}
          >
            Clear Cart
          </Button>
          <Button
            onClick={handleFinalizeSale}
            className={"bg-green-500 text-md hover:bg-green-400"}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Finalize Sale"}
          </Button>
          <Button
            onClick={handleFinalizeSaleWithDelivery}
            className="bg-orange-500 text-md hover:bg-orange-400"
            disabled={isSubmitting || isEditMode}
          >
            {isSubmitting ? "Saving..." : "Finalize Sale + Delivery"}
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-blue-500 text-md hover:bg-blue-400"
            disabled={isEditMode}
          >
            Print Invoice
          </Button>
          <Button
            onClick={handlePrintDelivery}
            className="bg-cyan-400 text-md hover:bg-cyan-300"
            disabled={isEditMode}
          >
            Print Delivery
          </Button>
          {/* Updated Back Button */}
          <Link href="/sales">
            <Button
              variant="outline"
              onClick={resetAllStates} // This handles button click
            >
              Back to Sales
            </Button>
          </Link>
        </div>
      </div>

      <AddDeliveryModal
        isOpen={isModalOpen}
        onClose={handleClose}
        saleId={saleData?.saleId}
        customerId={saleData?.customer?.id || 1}
        onSuccess={handleDeliverySuccess}
        key={saleData.saleId || date()}
        sendDeliveryDetails={triggerDeliveryPrint}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Panel */}
        <Card>
          <CardContent>
            {/* Customer */}
            <h3 className="text-lg font-semibold mb-3">Customer</h3>
            <Input
              placeholder="Search customer..."
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setCustomerSuggestionsVisible(true);
              }}
              onFocus={() => setCustomerSuggestionsVisible(true)}
              onBlur={() =>
                setTimeout(() => setCustomerSuggestionsVisible(false), 150)
              }
            />
            <div className="mt-2 text-sm text-gray-600">
              Selected:{" "}
              <span className="font-medium text-[1rem]">
                {customer?.name || "Walk-in Customer"}
              </span>
            </div>

            {customerSuggestionsVisible &&
              customerQuery &&
              customerSuggestions.length > 0 && (
                <div className="absolute z-20 bg-white border rounded-md w-[27svw] drop-shadow-xl -mt-5 max-h-40 overflow-auto">
                  {customerSuggestions.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-slate-100 cursor-pointer px-7 rounded-md"
                      onMouseDown={() => {
                        setCustomer(c);
                        setCustomerQuery(c.name);
                        setCustomerSuggestionsVisible(false);
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}

            {/* Product */}
            <h3 className="text-lg font-semibold mb-3 mt-5">Add product</h3>
            <Input
              ref={barcodeRef}
              placeholder="Scan barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Search product..."
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                setProductSuggestionsVisible(true);
              }}
              onFocus={() => setProductSuggestionsVisible(true)}
              onBlur={() =>
                setTimeout(() => setProductSuggestionsVisible(false), 150)
              }
              className="mb-2"
            />

            {productSuggestionsVisible &&
              productQuery &&
              productSuggestions.length > 0 && (
                <div className="mb-2 max-h-48 overflow-y-scroll border rounded-md drop-shadow-xl bg-white">
                  {productSuggestions.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 px-4 hover:bg-slate-100 cursor-pointer border-b"
                      onMouseDown={() => {
                        setSelectedProduct(p);
                        setProductQuery(p.name);
                        setBarcodeInput(p.barcode);
                        setProductSuggestionsVisible(false);
                      }}
                    >
                      <div className="font-medium text-[1.12rem] mb-1">
                        {p.name}
                      </div>
                      <div className=" text-gray-900 font-bold text-[.79rem] flex gap-4">
                        <span>
                          <span className="text-[.8rem] font-semibold text-gray-700">
                            Stock:{" "}
                          </span>{" "}
                          {p.stockQuantity}
                        </span>{" "}
                        <span>
                          <span className="text-[.8rem] font-semibold text-gray-700">
                            Price:{" "}
                          </span>{" "}
                          AFN {p.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            <div className=" flex justify-between items-center max-xl:flex-col">
              <div>
                {/* Qty + Discount */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-28">
                    <label className="text-xs text-gray-600">Qty</label>
                    {/* Qty input (changed: prevent native keyboard with readOnly + inputMode, add pointer handler) */}
                    <Input
                      type="text"
                      inputMode="decimal"
                      min={0}
                      step={selectedProduct?.unit === "kg" ? "0.1" : "1"} // Allow decimals for kg
                      value={quantity === "" ? "" : quantity}
                      placeholder="1"
                      data-input-type="quantity"
                      readOnly
                      onPointerDown={() => {
                        setActiveInput("quantity");
                        setKeyboardVisible(true);
                        if (quantity === 1) setQuantity("");
                      }}
                      onFocus={() => {
                        // keep existing focus behavior as fallback
                        setActiveInput("quantity");
                        setKeyboardVisible(true);
                        if (quantity === 1) setQuantity("");
                      }}
                      onBlur={() => {
                        if (quantity === "") setQuantity(1);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setQuantity("");
                          return;
                        }
                        const num = Number(val);
                        if (num >= 0) {
                          // For pcs, only allow integers
                          if (selectedProduct?.unit === "pcs") {
                            if (Number.isInteger(num)) {
                              setQuantity(num);
                            }
                          } else {
                            // For kg, allow decimals
                            setQuantity(num);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Only block negative numbers and scientific notation
                        // Allow decimal point for kg items
                        if (selectedProduct?.unit === "pcs") {
                          // For pcs, block decimal point
                          if (["-", ".", "e", "E"].includes(e.key))
                            e.preventDefault();
                        } else {
                          // For kg, only block negative and scientific notation
                          if (["-", "e", "E"].includes(e.key))
                            e.preventDefault();
                        }
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-xs text-gray-600">Discount</label>
                    {/* Discount input (changed similarly) */}
                    <Input
                      type="number"
                      step="1"
                      min={0}
                      value={itemDiscount}
                      data-input-type="discount"
                      readOnly
                      inputMode="none"
                      onPointerDown={() => {
                        setActiveInput("discount");
                        setKeyboardVisible(true);
                      }}
                      onFocus={() => {
                        setActiveInput("discount");
                        setKeyboardVisible(true);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setItemDiscount("");
                          return;
                        }
                        const num = Number(val);
                        if (num >= 0 && Number.isInteger(num)) {
                          setItemDiscount(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (["-", ".", "e", "E"].includes(e.key))
                          e.preventDefault();
                      }}
                    />
                  </div>
                  <div className="flex-1" />
                </div>

                {selectedProduct && (
                  <div className="mt-3 text-sm text-gray-600">
                    Selected: <strong>{selectedProduct.name}</strong> • AFN
                    <strong> {selectedProduct.price}</strong>
                  </div>
                )}

                {/* Payment method + Tax */}
                <div className="flex items-center gap-2 mt-3">
                  {/* Custom Payment Method Dropdown */}
                  <div className="w-28 relative">
                    <label className="text-xs text-gray-600">
                      Payment method
                    </label>
                    <div
                      className="mt-1 p-2 border rounded bg-white cursor-pointer"
                      onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                    >
                      {paymentMethod ? (
                        <span className="text-sm">{paymentMethod}</span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Select method...
                        </span>
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

                  {/* Tax Amount */}
                  <div className="w-32">
                    <label className="text-xs text-gray-600">Tax amount</label>
                    {/* Tax input (changed similarly) */}
                    <Input
                      type="number"
                      step="1"
                      min={0}
                      value={taxAmount}
                      data-input-type="tax"
                      readOnly
                      inputMode="none"
                      onPointerDown={() => {
                        setActiveInput("tax");
                        setKeyboardVisible(true);
                      }}
                      onFocus={() => {
                        setActiveInput("tax");
                        setKeyboardVisible(true);
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setTaxAmount("");
                          return;
                        }
                        const num = Number(val);
                        if (num >= 0 && Number.isInteger(num)) {
                          setTaxAmount(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (["-", ".", "e", "E"].includes(e.key))
                          e.preventDefault();
                      }}
                    />
                  </div>

                  <div className="flex-1" />
                </div>
              </div>
              <div className=" flex justify-end mt-8">
                <motion.button
                  onClick={onAdd}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex items-center justify-center gap-2 size-16 bg-green-500 hover:bg-green-600 rounded-md"
                >
                  <Plus className="size-7 text-white" />
                </motion.button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel */}
        <div className="md:col-span-2">
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-3">Items</h3>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500"
                      >
                        No items
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.tempId}>
                        <TableCell>
                          {editingId === row.tempId ? (
                            <Input
                              value={editValues?.name || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <div>
                              <div className="font-medium">{row.name}</div>
                              <div className="text-xs text-gray-500">
                                {row.barcode}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === row.tempId ? (
                            <Input
                              onFocus={() => {
                                setActiveInput("unitPrice");
                                setKeyboardVisible(true);
                              }}
                              onPointerDown={() => {
                                setActiveInput("unitPrice");
                                setKeyboardVisible(true);
                              }}
                              data-input-type="unitPrice"
                              onKeyDown={(e) => {
                                if (["-", ".", "e", "E"].includes(e.key))
                                  e.preventDefault();
                              }}
                              type="number"
                              step="1"
                              min={0}
                              value={String(
                                editValues?.unitPrice ?? row.unitPrice
                              )}
                              readOnly
                              inputMode="none"
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  unitPrice: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            "AFN " + Number(row.unitPrice)
                          )}
                        </TableCell>
                        <TableCell className="w-28">
                          {editingId === row.tempId ? (
                            <Input
                              onFocus={() => {
                                setActiveInput("editQuantity");
                                setKeyboardVisible(true);
                              }}
                              onPointerDown={() => {
                                setActiveInput("editQuantity");
                                setKeyboardVisible(true);
                              }}
                              data-input-type="editQuantity"
                              type="text"
                              inputMode="decimal"
                              min={0}
                              step={editValues?.unit === "kg" ? "0.01" : "1"} // Allow decimals for kg
                              value={String(
                                editValues?.quantity ?? row.quantity
                              )}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = Number(val);

                                if (num >= 0) {
                                  // For pcs, only allow integers
                                  if (editValues?.unit === "pcs") {
                                    if (Number.isInteger(num)) {
                                      setEditValues((s) => ({
                                        ...(s || {}),
                                        quantity: num,
                                      }));
                                    }
                                  } else {
                                    // For kg, allow decimals
                                    setEditValues((s) => ({
                                      ...(s || {}),
                                      quantity: num,
                                    }));
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (editValues?.unit === "pcs") {
                                  // For pcs, block decimal point
                                  if (["-", ".", "e", "E"].includes(e.key))
                                    e.preventDefault();
                                } else {
                                  // For kg, only block negative and scientific notation
                                  if (["-", "e", "E"].includes(e.key))
                                    e.preventDefault();
                                }
                              }}
                            />
                          ) : (
                            row.quantity
                          )}
                        </TableCell>
                        <TableCell>{row.unit || "No unit provided"}</TableCell>
                        <TableCell className="w-32">
                          {editingId === row.tempId ? (
                            <Input
                              onFocus={() => {
                                setActiveInput("editDiscount");
                                setKeyboardVisible(true);
                              }}
                              onPointerDown={() => {
                                setActiveInput("editDiscount");
                                setKeyboardVisible(true);
                              }}
                              data-input-type="editDiscount"
                              onKeyDown={(e) => {
                                if (["-", ".", "e", "E"].includes(e.key))
                                  e.preventDefault();
                              }}
                              type="number"
                              min={0}
                              step="1"
                              value={String(
                                editValues?.discount ?? row.discount
                              )}
                              readOnly
                              inputMode="none"
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  discount: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            "AFN " + Number(row.discount || 0)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === row.tempId
                            ? "AFN " +
                              Math.floor(
                                Number(editValues?.unitPrice || 0) *
                                  Number(editValues?.quantity || 0) -
                                  Number(editValues?.discount || 0)
                              )
                            : "AFN " + row.subtotal}
                        </TableCell>
                        <TableCell className="w-36">
                          {editingId === row.tempId ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="w-4 h-4" /> Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditValues(null);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => startEdit(row)}>
                                <Edit className="w-4 h-4" /> Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem(row.tempId)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end gap-4">
                <div className="bg-slate-50 p-3 rounded border text-right">
                  <div className="text-sm text-gray-600">
                    Subtotal: AFN {Math.floor(totals.subtotal)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Discounts: -AFN {Math.floor(totals.discount)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Tax: AFN {Math.floor(Number(taxAmount || 0))}
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    Total: AFN {Math.floor(totals.final + (taxAmount || 0))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* hidden invoice */}
      <div className="hidden">
        {lastPrintedSale && (
          <Invoice
            ref={invoiceRef}
            items={lastPrintedSale.items}
            customer={lastPrintedSale.customer}
            totals={lastPrintedSale.totals}
            saleId={lastPrintedSale.saleId}
            date={lastPrintedSale.date}
          />
        )}
      </div>

      {keyboardVisible && (
        <div
          ref={keyboardRef}
          style={{
            position: "fixed",
            bottom: "40px",
            right: "40px",
            zIndex: 9999,
          }}
        >
          <NumericKeyboard onInput={handleKeyboardInput} />
        </div>
      )}

      <div className="hidden">
        {lastPrintedDelivery && (
          <Delivery
            ref={deliveryRef}
            customer={lastPrintedDelivery.customer || "test"}
            address={lastPrintedDelivery.deliveryAddress || "test"}
            deliveryDate={lastPrintedDelivery.deliveryDate || "test"}
            deliveryFee={lastPrintedDelivery.deliveryFee || "test"}
            saleId={lastPrintedDelivery.saleId || "test"}
            phone={lastPrintedDelivery.customerPhone}
            driver={lastPrintedDelivery.driver || "test"}
          />
        )}
      </div>
    </div>
  );
}
