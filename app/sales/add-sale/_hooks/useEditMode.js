"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";

export function useEditMode({ onPopulateForm, onReset }) {
  const searchParams = useSearchParams();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editSaleId, setEditSaleId] = useState(null);
  const [hasFetchedEditData, setHasFetchedEditData] = useState(false);

  // Keep latest callbacks in refs so effects never need them as deps
  const onResetRef = useRef(onReset);
  const onPopulateFormRef = useRef(onPopulateForm);
  onResetRef.current = onReset;
  onPopulateFormRef.current = onPopulateForm;

  const resetEditMode = useCallback(() => {
    flushSync(() => {
      setIsEditMode(false);
      setEditSaleId(null);
      setHasFetchedEditData(false);
    });
  }, []);

  // Extract primitive strings — avoids object reference instability from useSearchParams
  const editParam = searchParams.get("edit");
  const idParam = searchParams.get("id");

  // Track previous editParam to detect edit→normal transitions
  const prevEditParamRef = useRef(editParam);

  // Sync internal state with URL params
  useEffect(() => {
    if (editParam === "true" && idParam) {
      setIsEditMode(true);
      setEditSaleId(idParam);
      setHasFetchedEditData(false);
    } else {
      setIsEditMode(false);
      setEditSaleId(null);
      setHasFetchedEditData(false);
      // Only reset the form when leaving edit mode, not on every non-edit render
      if (prevEditParamRef.current === "true") {
        onResetRef.current?.();
      }
    }
    prevEditParamRef.current = editParam;
  }, [editParam, idParam]);

  // Fetch sale data when edit mode is active and data hasn't been loaded yet
  useEffect(() => {
    if (!isEditMode || !editSaleId || hasFetchedEditData) return;

    let cancelled = false;
    const loadingToast = toast.loading("Loading sale data...");

    fetch(`/api/sale/editSale/${editSaleId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setHasFetchedEditData(true);
          onPopulateFormRef.current(data.data);
          toast.success("Sale loaded for editing", { id: loadingToast });
        } else {
          toast.error("Failed to fetch sale data", { id: loadingToast });
          setIsEditMode(false);
          setEditSaleId(null);
          onResetRef.current?.();
        }
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Error loading sale for editing", { id: loadingToast });
        setIsEditMode(false);
        setEditSaleId(null);
        onResetRef.current?.();
      });

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editSaleId, hasFetchedEditData]);

  return { isEditMode, editSaleId, resetEditMode };
}
