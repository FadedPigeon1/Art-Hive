import React from "react";

const ColorPickerPanel = ({
  brushColor,
  setBrushColor,
  hsl,
  setHsl,
  swatches,
  addSwatch,
}) => {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-bold">
        Color
      </h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl border-2 border-[#333] shadow-inner"
            style={{ backgroundColor: brushColor }}
          />
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={brushColor.toUpperCase()}
                readOnly
                className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-1.5 text-xs font-mono text-gray-300 focus:outline-none"
              />
              <input
                type="color"
                value={brushColor}
                onChange={(e) => {
                  setBrushColor(e.target.value);
                  addSwatch(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Hue</label>
            <input
              type="range"
              min="0"
              max="360"
              value={hsl.h}
              onChange={(e) =>
                setHsl((prev) => ({
                  ...prev,
                  h: Number(e.target.value),
                }))
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), 
                  hsl(360, 100%, 50%))`,
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Saturation</label>
            <input
              type="range"
              min="0"
              max="100"
              value={hsl.s}
              onChange={(e) =>
                setHsl((prev) => ({
                  ...prev,
                  s: Number(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer accent-gray-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Lightness</label>
            <input
              type="range"
              min="0"
              max="100"
              value={hsl.l}
              onChange={(e) =>
                setHsl((prev) => ({
                  ...prev,
                  l: Number(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-[#333] rounded-full appearance-none cursor-pointer accent-gray-400"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              Swatches
            </label>
            <button
              onClick={() => addSwatch(brushColor)}
              className="text-[10px] px-2 py-0.5 bg-[#333] hover:bg-[#444] rounded text-gray-300 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {swatches.map((color, idx) => (
              <button
                key={idx}
                onClick={() => setBrushColor(color)}
                className={`aspect-square rounded-md border transition-transform hover:scale-110 ${
                  brushColor === color
                    ? "border-white ring-1 ring-white/50"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerPanel;
