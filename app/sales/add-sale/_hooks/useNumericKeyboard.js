"use client";

import { useState, useEffect, useRef } from "react";

export function useNumericKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const keyboardRef = useRef(null);

  function openKeyboard(inputType) {
    setActiveInput(inputType);
    setKeyboardVisible(true);
  }

  function closeKeyboard() {
    setKeyboardVisible(false);
    setActiveInput(null);
  }

  useEffect(() => {
    function handlePointerOutside(event) {
      if (!keyboardVisible || !keyboardRef.current) return;
      if (keyboardRef.current.contains(event.target)) return;

      const numericInput = event.target.closest("[data-input-type]");
      if (numericInput) {
        const type = numericInput.getAttribute("data-input-type");
        if (type !== activeInput) setActiveInput(type);
        return;
      }

      closeKeyboard();
    }

    document.addEventListener("pointerdown", handlePointerOutside);
    return () => document.removeEventListener("pointerdown", handlePointerOutside);
  }, [keyboardVisible, activeInput]);

  return { keyboardVisible, activeInput, keyboardRef, openKeyboard, closeKeyboard };
}
