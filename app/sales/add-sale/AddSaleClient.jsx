"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

import { Card, CardContent } from "@/components/ui/card";
import Invoice from "@/components/Invoice";
import Delivery from "@/components/Delivery";
import AddDeliveryModal from "../components/AddDeliveryModal";

import { useSaleCart } from "./_hooks/useSaleCart";
import { useEditMode } from "./_hooks/useEditMode";
import { usePrinting } from "./_hooks/usePrinting";
import { useNumericKeyboard } from "./_hooks/useNumericKeyboard";

import SaleHeader from "./_components/SaleHeader";
import CustomerSearch from "./_components/CustomerSearch";
import ProductSearch from "./_components/ProductSearch";
import CartTable from "./_components/CartTable";

const NumericKeyboard = dynamic(() => import("@/components/NumericKeyboard"), {
  ssr: false,
});

export default function AddSaleClient() {
  const router = useRouter();
  const barcodeRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [taxAmount, setTaxAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleData, setSaleData] = useState({});

  const cart = useSaleCart();
  const printing = usePrinting();
  const keyboard = useNumericKeyboard();

  const resetForm = useCallback(() => {
    setCustomer(null);
    setSelectedProduct(null);
    setQuantity(1);
    setItemDiscount(0);
    setPaymentMethod("Cash");
    setTaxAmount(0);
    cart.clear();
    setTimeout(() => barcodeRef.current?.focus(), 100);
  }, [cart]);

  const { isEditMode, editSaleId, resetEditMode } = useEditMode({
    onPopulateForm: (data) => {
      resetForm();
      if (data.customer) setCustomer(data.customer);
      setPaymentMethod(data.paymentMethod || "Cash");
      setTaxAmount(Number(data.taxAmount) || 0);
      cart.populateFromSaleData(data, { clear: cart.clear });
      setTimeout(() => barcodeRef.current?.focus(), 100);
    },
    onReset: resetForm,
  });

  // Fetch customers
  useEffect(() => {
    let active = true;
    fetch("/api/customer/")
      .then((r) => r.json())
      .then((d) => { if (d.success && active) setCustomers(d.data); })
      .catch(() => toast.error("Failed to fetch customers"));
    return () => { active = false; };
  }, []);

  // Fetch products (refetch when edit mode changes)
  useEffect(() => {
    let active = true;
    fetch("/api/products/")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && active) {
          setProducts(
            d.data.filter(
              (p) => p.status === "ACTIVE" && !p.isDeleted && p.stockQuantity > 0
            )
          );
        }
      })
      .catch(() => toast.error("Failed to fetch products"));
    return () => { active = false; };
  }, [isEditMode]);

  // Focus barcode on mount
  useEffect(() => {
    if (barcodeRef.current && !isEditMode) barcodeRef.current.focus();
  }, [isEditMode]);

  function buildPayload() {
    return {
      customerId: customer?.id ?? 1,
      paymentMethod: paymentMethod || "Cash",
      taxAmount: Math.floor(Number(taxAmount || 0)),
      items: cart.items.map((it) => ({
        productId: it.productId,
        quantity:
          it.unit === "kg" ? Number(it.quantity) : Math.floor(Number(it.quantity)),
        unitPrice: Math.floor(Number(it.unitPrice)),
        discount: Math.floor(Number(it.discount || 0)),
        subtotal: Math.floor(Number(it.subtotal)),
      })),
      totalAmount: Math.floor(cart.totals.final + Number(taxAmount || 0)),
    };
  }

  async function handleFinalizeSale() {
    if (cart.items.length === 0) return toast.error("No items to finalize");
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const res =
        isEditMode && editSaleId
          ? await fetch(`/api/sale/editSale/${editSaleId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/sale", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

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
        items: [...cart.items],
        totals: { ...cart.totals },
      };

      printing.triggerInvoicePrint(finalized);

      if (!isEditMode) {
        cart.addFinalizedSale({
          id: finalized.saleId ?? Date.now(),
          customer: finalized.customer,
          items: finalized.items,
          total: payload.totalAmount,
          date: finalized.date,
          serverSale,
        });
      }

      cart.clear();
      setCustomer(null);
      setPaymentMethod("Cash");
      setTaxAmount(0);
      toast.success(`Sale ${isEditMode ? "updated" : "finalized"} successfully!`);

      if (isEditMode) {
        resetEditMode();
        router.push("/sales");
      }
    } catch {
      toast.error("Network or unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinalizeSaleWithDelivery() {
    if (cart.items.length === 0) return toast.error("No items to finalize");
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
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
        items: [...cart.items],
        totals: { ...cart.totals },
      };

      setSaleData(finalized);
      cart.addFinalizedSale({
        id: finalized.saleId ?? Date.now(),
        customer: finalized.customer,
        items: finalized.items,
        total: payload.totalAmount,
        date: finalized.date,
        serverSale,
      });

      setTimeout(() => {
        cart.clear();
        setCustomer(null);
        setPaymentMethod("Cash");
        setTaxAmount(0);
        toast.success("Sale saved — now add delivery info");
        setIsModalOpen(true);
      }, 800);
    } catch {
      toast.error("Network or unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeliverySuccess(delivery) {
    printing.triggerInvoicePrint(saleData);
    setTimeout(() => printing.triggerDeliveryPrint(delivery), 1000);
    toast.success("Delivery successfully created!");
    setSaleData({});
  }

  function handleKeyboardInput(value) {
    const { activeInput } = keyboard;
    if (!activeInput) return;

    if (value === "backspace") {
      if (activeInput === "quantity")
        setQuantity((p) => String(p).slice(0, -1) || "");
      if (activeInput === "discount")
        setItemDiscount((p) => String(p).slice(0, -1) || "");
      if (activeInput === "tax")
        setTaxAmount((p) => String(p).slice(0, -1) || "");
      if (activeInput === "unitPrice" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          unitPrice: String(p.unitPrice || "").slice(0, -1) || "",
        }));
      if (activeInput === "editQuantity" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          quantity: String(p.quantity || "").slice(0, -1) || "",
        }));
      if (activeInput === "editDiscount" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          discount: String(p.discount || "").slice(0, -1) || "",
        }));
      return;
    }

    if (value === ".") {
      const isKg =
        (activeInput === "quantity" && selectedProduct?.unit === "kg") ||
        (activeInput === "editQuantity" && cart.editValues?.unit === "kg");
      if (!isKg) return;

      if (activeInput === "quantity") {
        const cur = String(quantity || "0");
        if (!cur.includes(".")) setQuantity(cur === "0" ? "0." : cur + ".");
      }
      if (activeInput === "editQuantity" && cart.editValues) {
        const cur = String(cart.editValues.quantity || "0");
        if (!cur.includes("."))
          cart.setEditValues((p) => ({
            ...p,
            quantity: cur === "0" ? "0." : cur + ".",
          }));
      }
      return;
    }

    if (/^\d$/.test(value)) {
      if (activeInput === "quantity")
        setQuantity((p) => {
          const cur = String(p || "0");
          return cur === "0" ? value : cur + value;
        });
      if (activeInput === "discount")
        setItemDiscount((p) => (p ? p + value : value));
      if (activeInput === "tax")
        setTaxAmount((p) => (p ? p + value : value));
      if (activeInput === "unitPrice" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          unitPrice: p.unitPrice ? String(p.unitPrice) + value : value,
        }));
      if (activeInput === "editQuantity" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          quantity: p.quantity ? String(p.quantity) + value : value,
        }));
      if (activeInput === "editDiscount" && cart.editValues)
        cart.setEditValues((p) => ({
          ...p,
          discount: p.discount ? String(p.discount) + value : value,
        }));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <SaleHeader
        isEditMode={isEditMode}
        editSaleId={editSaleId}
        isSubmitting={isSubmitting}
        onFinalizeSale={handleFinalizeSale}
        onFinalizeSaleWithDelivery={handleFinalizeSaleWithDelivery}
        onPrint={printing.handlePrint}
        onPrintDelivery={printing.handlePrintDelivery}
        onClearCart={cart.clear}
        onReset={resetForm}
      />

      <AddDeliveryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSaleData({}); }}
        saleId={saleData?.saleId}
        customerId={saleData?.customer?.id || 1}
        onSuccess={handleDeliverySuccess}
        key={saleData.saleId || 0}
        sendDeliveryDetails={printing.triggerDeliveryPrint}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <CustomerSearch
              customers={customers}
              customer={customer}
              onSelect={setCustomer}
            />
            <ProductSearch
              products={products}
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
              quantity={quantity}
              setQuantity={setQuantity}
              itemDiscount={itemDiscount}
              setItemDiscount={setItemDiscount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              taxAmount={taxAmount}
              setTaxAmount={setTaxAmount}
              onAdd={() => {
                cart.onAddItem(selectedProduct, quantity, itemDiscount);
                setSelectedProduct(null);
                setQuantity(1);
                setItemDiscount(0);
              }}
              openKeyboard={keyboard.openKeyboard}
              barcodeRef={barcodeRef}
              isEditMode={isEditMode}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Card>
            <CardContent>
              <CartTable
                items={cart.items}
                editingId={cart.editingId}
                editValues={cart.editValues}
                setEditValues={cart.setEditValues}
                totals={cart.totals}
                taxAmount={taxAmount}
                onStartEdit={cart.startEdit}
                onSaveEdit={cart.saveEdit}
                onCancelEdit={cart.cancelEdit}
                onDeleteItem={cart.deleteItem}
                openKeyboard={keyboard.openKeyboard}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden invoice print area */}
      <div className="hidden">
        {printing.lastPrintedSale && (
          <Invoice
            ref={printing.invoiceRef}
            items={printing.lastPrintedSale.items}
            customer={printing.lastPrintedSale.customer}
            totals={printing.lastPrintedSale.totals}
            saleId={printing.lastPrintedSale.saleId}
            date={printing.lastPrintedSale.date}
          />
        )}
      </div>

      {/* Hidden delivery print area */}
      <div className="hidden">
        {printing.lastPrintedDelivery && (
          <Delivery
            ref={printing.deliveryRef}
            customer={printing.lastPrintedDelivery.customer || ""}
            address={printing.lastPrintedDelivery.deliveryAddress || ""}
            deliveryDate={printing.lastPrintedDelivery.deliveryDate || ""}
            deliveryFee={printing.lastPrintedDelivery.deliveryFee || ""}
            saleId={printing.lastPrintedDelivery.saleId || ""}
            phone={printing.lastPrintedDelivery.customerPhone}
            driver={printing.lastPrintedDelivery.driver || ""}
          />
        )}
      </div>

      {keyboard.keyboardVisible && (
        <div
          ref={keyboard.keyboardRef}
          style={{ position: "fixed", bottom: "40px", right: "40px", zIndex: 9999 }}
        >
          <NumericKeyboard onInput={handleKeyboardInput} />
        </div>
      )}
    </div>
  );
}
