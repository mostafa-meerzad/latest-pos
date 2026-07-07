"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { toast } from "react-hot-toast";
import { useSearchParams, usePathname } from "next/navigation";

export function useEditMode({ onPopulateForm, onReset }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editSaleId, setEditSaleId] = useState(null);
  const [hasFetchedEditData, setHasFetchedEditData] = useState(false);

  const reset = useCallback(() => {
    setIsEditMode(false);
    setEditSaleId(null);
    setHasFetchedEditData(false);
    onReset?.();
  }, [onReset]);

  const resetEditMode = useCallback(() => {
    flushSync(() => {
      setIsEditMode(false);
      setEditSaleId(null);
      setHasFetchedEditData(false);
    });
  }, []);

  const fetchSaleData = useCallback(
    async (saleId) => {
      if (!saleId || hasFetchedEditData) return;

      const loadingToast = toast.loading("Loading sale data...");
      try {
        const res = await fetch(`/api/sale/editSale/${saleId}`);
        const data = await res.json();

        if (data.success) {
          setHasFetchedEditData(true);
          onPopulateForm(data.data);
          toast.success("Sale loaded for editing", { id: loadingToast });
        } else {
          toast.error("Failed to fetch sale data", { id: loadingToast });
          reset();
        }
      } catch {
        toast.error("Error loading sale for editing", { id: loadingToast });
        reset();
      }
    },
    [hasFetchedEditData, onPopulateForm, reset]
  );

  // Detect edit mode from URL params
  useEffect(() => {
    const edit = searchParams.get("edit");
    const id = searchParams.get("id");

    if (edit === "true" && id) {
      setIsEditMode(true);
      setEditSaleId(id);
      setHasFetchedEditData(false);
    } else {
      reset();
    }
  }, [searchParams, isEditMode, reset]);

  // Guard against stale edit state on navigation
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const edit = currentParams.get("edit");
    const id = currentParams.get("id");

    if (!edit && !id && isEditMode) reset();
    if (!pathname.includes("/sales/add-sale") && isEditMode) reset();
  }, [pathname, searchParams, isEditMode, reset]);

  // Trigger fetch when ready
  useEffect(() => {
    const edit = searchParams.get("edit");
    const id = searchParams.get("id");
    if (edit === "true" && id && !hasFetchedEditData) {
      fetchSaleData(id);
    }
  }, [searchParams, hasFetchedEditData, fetchSaleData]);

  return { isEditMode, editSaleId, resetEditMode };
}
