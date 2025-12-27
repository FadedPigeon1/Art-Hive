import React from "react";
import { useSketchbookStore, BRUSH_TYPES } from "../store/useSketchbookStore";

const BrushSettings = () => {
  const {
    brushType,
    brushSize,
    brushOpacity,
    brushFlow,
    setBrushType,
    setBrushSize,
    setBrushOpacity,
    setBrushFlow,
  } = useSketchbookStore();

  const onBrushTypeChange = setBrushType;
  const onBrushSizeChange = setBrushSize;
  const onBrushOpacityChange = setBrushOpacity;
  const onBrushFlowChange = setBrushFlow;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
      <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
        Brush Settings
      </h3>

      {/* Brush Type Selection */}
      <div className="mb-4">
        <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2 block">
          Brush Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(BRUSH_TYPES).map(([key, { name, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => onBrushTypeChange(key)}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center space-y-1 ${
                brushType === key
                  ? "border-primary-light bg-primary-light/10"
                  : "border-border-light dark:border-border-dark hover:border-primary-light/50"
              }`}
              title={name}
            >
              <Icon size={20} />
              <span className="text-xs">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Size
          </label>
          <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
            {brushSize}px
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Brush Opacity */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Opacity
          </label>
          <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
            {brushOpacity}%
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={brushOpacity}
          onChange={(e) => onBrushOpacityChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Brush Flow */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Flow
          </label>
          <span className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
            {brushFlow}%
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={brushFlow}
          onChange={(e) => onBrushFlowChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default BrushSettings;
