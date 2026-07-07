"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";

export function usePrinting() {
  const invoiceRef = useRef(null);
  const deliveryRef = useRef(null);

  const [lastPrintedSale, setLastPrintedSale] = useState(null);
  const [lastPrintedDelivery, setLastPrintedDelivery] = useState(null);

  const handlePrint = useReactToPrint({ contentRef: invoiceRef });
  const handlePrintDelivery = useReactToPrint({ contentRef: deliveryRef });

  useEffect(() => {
    if (lastPrintedSale && invoiceRef.current) {
      const t = setTimeout(() => handlePrint(), 100);
      return () => clearTimeout(t);
    }
  }, [lastPrintedSale]);

  useEffect(() => {
    if (lastPrintedDelivery && deliveryRef.current) {
      const t = setTimeout(() => handlePrintDelivery(), 800);
      return () => clearTimeout(t);
    }
  }, [lastPrintedDelivery]);

  function triggerInvoicePrint(saleData) {
    setLastPrintedSale(saleData);
  }

  function triggerDeliveryPrint(deliveryData) {
    setLastPrintedDelivery(deliveryData);
  }

  return {
    invoiceRef,
    deliveryRef,
    lastPrintedSale,
    lastPrintedDelivery,
    handlePrint,
    handlePrintDelivery,
    triggerInvoicePrint,
    triggerDeliveryPrint,
  };
}
