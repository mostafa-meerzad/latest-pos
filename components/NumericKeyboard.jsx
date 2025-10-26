import React from "react";
import "./numeric-keyboard.css";

const NumericKeyboard = ({ onInput }) => {
  const handleButtonClick = (value, e) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event bubbling
    onInput(value);
  };

  return (
    <div className="numeric-keyboard-container">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
        <button
          key={num}
          onClick={(e) => handleButtonClick(num, e)}
          className="numeric-key"
          type="button"
        >
          {num}
        </button>
      ))}

      <button
        onClick={(e) => handleButtonClick("backspace", e)}
        className="numeric-key"
        title="Backspace"
        type="button"
      >
        ⌫
      </button>

      <button 
        onClick={(e) => handleButtonClick("0", e)} 
        className="numeric-key zero"
        type="button"
      >
        0
      </button>

      <button
        onClick={(e) => handleButtonClick(".", e)}
        className="numeric-key decimal"
        type="button"
      >
        .
      </button>
    </div>
  );
};

export default NumericKeyboard;