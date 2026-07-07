"use client";

import { useState, useEffect, useRef } from "react";

export function useNumericKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const keyboardRef = useRef(null);

  function openKeyboard(inputType) {
    setActiveInput(inputType);
    setKeyboardVisible(true);
  }

  function closeKeyboard() {
    setKeyboardVisible(false);
    setActiveInput(null);
  }

  // Reposition keyboard whenever the active input changes
  useEffect(() => {
    if (!activeInput || !keyboardVisible) return;

    const inputElement = document.querySelector(
      `[data-input-type="${activeInput}"]`
    );
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const keyboardHeight = 250;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const top =
      spaceBelow < keyboardHeight && spaceAbove > keyboardHeight
        ? rect.top + scrollTop - keyboardHeight - 10
        : rect.bottom + scrollTop + 10;

    const maxLeft = window.innerWidth - 300;
    const left = Math.min(rect.left + scrollLeft, maxLeft);

    setKeyboardPosition({ top, left });
  }, [activeInput, keyboardVisible]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (!keyboardVisible || !keyboardRef.current) return;

      const clickedInsideKeyboard = keyboardRef.current.contains(event.target);
      const clickedNumericInput = event.target.closest("[data-input-type]");

      if (clickedNumericInput) {
        const newType = clickedNumericInput.getAttribute("data-input-type");
        if (newType !== activeInput) setActiveInput(newType);
        return;
      }

      if (!clickedInsideKeyboard) closeKeyboard();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [keyboardVisible, activeInput]);

  return {
    keyboardVisible,
    activeInput,
    keyboardPosition,
    keyboardRef,
    openKeyboard,
    closeKeyboard,
  };
}
