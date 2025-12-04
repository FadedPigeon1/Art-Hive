import React, { useState, useEffect } from "react";
import { FiDroplet } from "react-icons/fi";

const ColorPicker = ({ brushColor, onColorChange, swatches, onAddSwatch }) => {
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });

  // Convert hex to HSL when brushColor changes externally
  useEffect(() => {
    const hex = brushColor;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
        default:
          h = 0;
      }
    }

    setHsl({
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    });
  }, [brushColor]);

  const hslToRgb = (h, s, l) => {
    s = s / 100;
    l = l / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const rgb = [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
    return `#${rgb.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  };

  const handleHSLChange = (key, value) => {
    const newHsl = { ...hsl, [key]: value };
    setHsl(newHsl);
    const newColor = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    onColorChange(newColor);
  };

  const handleAddToSwatches = () => {
    if (!swatches.includes(brushColor)) {
      onAddSwatch(brushColor);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
      <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center space-x-2 mb-3">
        <FiDroplet className="text-primary-light" />
        <span>Color</span>
      </h3>

      {/* Current Color Display */}
      <div className="flex items-center space-x-3 mb-4">
        <div
          className="w-16 h-16 rounded-lg border-2 border-border-light dark:border-border-dark cursor-pointer shadow-inner"
          style={{ backgroundColor: brushColor }}
          onClick={handleAddToSwatches}
          title="Click to add to swatches"
        />
        <div className="flex-1">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border-2 border-border-light dark:border-border-dark"
          />
          <input
            type="text"
            value={brushColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded font-mono"
          />
        </div>
      </div>

      {/* HSL Sliders */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Hue
            </label>
            <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
              {hsl.h}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hsl.h}
            onChange={(e) => handleHSLChange("h", Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(to right, 
                hsl(0, 100%, 50%), 
                hsl(60, 100%, 50%), 
                hsl(120, 100%, 50%), 
                hsl(180, 100%, 50%), 
                hsl(240, 100%, 50%), 
                hsl(300, 100%, 50%), 
                hsl(360, 100%, 50%))`,
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Saturation
            </label>
            <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
              {hsl.s}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.s}
            onChange={(e) => handleHSLChange("s", Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Lightness
            </label>
            <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
              {hsl.l}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.l}
            onChange={(e) => handleHSLChange("l", Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Color Swatches */}
      <div>
        <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2 block">
          Swatches
        </label>
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((color, index) => (
            <button
              key={index}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                brushColor === color
                  ? "border-primary-light ring-2 ring-primary-light/50"
                  : "border-border-light dark:border-border-dark"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
