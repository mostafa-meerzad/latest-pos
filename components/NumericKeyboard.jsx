import React, { useState } from "react";
import "./numeric-keyboard.css";

const NumericKeyboard = ({ onInput }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInput = (value) => {
    if (value === "backspace") {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      onInput && onInput("backspace");
    } else if (value === "clear") {
      setInputValue("");
      onInput && onInput("clear");
    } else {
      const newValue = inputValue + value;
      setInputValue(newValue);
      onInput && onInput(value);
    }
  };

  return (
    <div className="numeric-keyboard-container">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
        <button
          key={num}
          onClick={() => handleInput(num)}
          className="numeric-key"
        >
          {num}
        </button>
      ))}

      

      <button
        onClick={() => handleInput("backspace")}
        className="numeric-key"
        title="Backspace"
      >
        ⌫
      </button>

      <button onClick={() => handleInput("0")} className="numeric-key zero">
        0
      </button>

      <button
        onClick={() => handleInput("clear")}
        className="numeric-key clear"
      >
        Clear
      </button>
    </div>
  );
};

export default NumericKeyboard;
