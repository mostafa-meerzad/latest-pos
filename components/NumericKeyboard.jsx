"use client";
import React, { useEffect, useRef, useState } from "react";
import Keyboard from "simple-keyboard";
import "simple-keyboard/build/css/index.css";
import "./numeric-keyboard.css";

export default function NumericKeyboard({ onChange, onClose }) {
  const keyboardContainerRef = useRef(null);
  const keyboardInstanceRef = useRef(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!keyboardContainerRef.current) return;

    keyboardInstanceRef.current = new Keyboard(keyboardContainerRef.current, {
      layout: {
        default: ["1 2 3", "4 5 6", "7 8 9", "{shift} 0 _", "{bksp} {close}"],
        shift: ["! / #", "$ % ^", "& * (", "{shift} ) +", "{bksp} {close}"],
      },
      display: {
        "{bksp}": "⌫",
        "{shift}": "⇧",
        "{close}": "✓",
      },
      theme: "hg-theme-default hg-layout-numeric numeric-theme",
      layoutName: "default",
      onKeyPress: (button) => handleKeyPress(button),
    });

    // Keep input focus
    const keepFocus = (e) => {
      const active = document.querySelector("input:focus");
      if (active) {
        e.preventDefault();
        active.focus();
      }
    };

    document.addEventListener("mousedown", keepFocus, true);

    return () => {
      document.removeEventListener("mousedown", keepFocus, true);
      keyboardInstanceRef.current?.destroy();
    };
  }, []);

  function handleKeyPress(button) {
    if (button === "{shift}") {
      toggleShift();
    } else if (button === "{close}") {
      onClose();
    } else if (button === "{bksp}") {
      handleBackspace();
    } else {
      handleInput(button);
    }
  }

  function toggleShift() {
    const currentLayout = keyboardInstanceRef.current.options.layoutName;
    const next = currentLayout === "default" ? "shift" : "default";
    keyboardInstanceRef.current.setOptions({ layoutName: next });
  }

  function handleInput(value) {
    const newValue = inputValue + value;
    setInputValue(newValue);
    onChange(value); // Send the individual key press
  }

  function handleBackspace() {
    const newValue = inputValue.slice(0, -1);
    setInputValue(newValue);
    onChange("backspace"); // Send "backspace" signal to parent
  }

  return (
    <div className="flex justify-center mt-4">
      <div
        ref={keyboardContainerRef}
        className="numeric-keyboard-container"
      ></div>
    </div>
  );
}