import React from "react";
import { useSketchbookStore } from "../store/useSketchbookStore";
import {
  FiLayers,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiTrash2,
} from "react-icons/fi";

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
];

const LayersPanel = () => {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    toggleLayerVisibility,
    duplicateLayer,
    deleteLayer,
    updateLayerOpacity,
    updateLayerBlendMode,
    mergeDown,
  } = useSketchbookStore();
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center">
          <FiLayers className="mr-2" size={14} /> Layers
        </h3>
        <button
          onClick={addLayer}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          title="New Layer"
        >
          <FiPlus size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`group p-3 rounded-xl border transition-all cursor-pointer ${
              activeLayerId === layer.id
                ? "border-blue-500/50 bg-blue-500/10 shadow-md"
                : "border-[#333] bg-[#2a2a2a] hover:border-gray-600"
            }`}
            onClick={() => setActiveLayerId(layer.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium truncate ${
                  activeLayerId === layer.id ? "text-blue-400" : "text-gray-300"
                }`}
              >
                {layer.name}
              </span>
              <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                >
                  {layer.visible ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"
                  title="Duplicate"
                >
                  <FiCopy size={14} />
                </button>
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 w-8">Opac</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateLayerOpacity(layer.id, Number(e.target.value));
                  }}
                  className="flex-1 h-1 bg-[#333] rounded-full appearance-none cursor-pointer accent-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 w-8">Mode</span>
                <select
                  value={layer.blendMode}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateLayerBlendMode(layer.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 text-xs bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-blue-500"
                >
                  {BLEND_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {layers.indexOf(layer) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  mergeDown(layer.id);
                }}
                className="w-full mt-2 py-1 text-[10px] uppercase tracking-wider font-medium text-gray-500 hover:text-gray-300 hover:bg-[#333] rounded transition-colors"
              >
                Merge Down
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;
