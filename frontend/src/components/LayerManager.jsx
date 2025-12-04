import React from "react";
import { toast } from "react-toastify";
import {
  FiEye,
  FiEyeOff,
  FiCopy,
  FiTrash2,
  FiLock,
  FiUnlock,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiPlus,
} from "react-icons/fi";

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
];

const LayerManager = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onUpdateOpacity,
  onUpdateBlendMode,
  onMergeDown,
  onMoveLayer,
}) => {
  const handleDeleteLayer = (layerId) => {
    if (layers.length === 1) {
      toast.error("Cannot delete the last layer");
      return;
    }
    onDeleteLayer(layerId);
  };

  const handleMergeDown = (layerId) => {
    const layerIndex = layers.findIndex((l) => l.id === layerId);
    if (layerIndex === 0) {
      toast.error("Cannot merge down the bottom layer");
      return;
    }
    onMergeDown(layerId);
  };

  const moveLayerUp = (layerId) => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index < layers.length - 1) {
      onMoveLayer(layerId, "up");
    }
  };

  const moveLayerDown = (layerId) => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index > 0) {
      onMoveLayer(layerId, "down");
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center space-x-2">
          <FiLayers className="text-primary-light" />
          <span>Layers</span>
        </h3>
        <button
          onClick={onAddLayer}
          className="p-1.5 rounded-lg bg-primary-light text-white hover:bg-primary-dark transition-colors"
          title="Add Layer"
        >
          <FiPlus size={16} />
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {[...layers].reverse().map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          const actualIndex = layers.length - 1 - index;

          return (
            <div
              key={layer.id}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isActive
                  ? "border-primary-light bg-primary-light/10"
                  : "border-border-light dark:border-border-dark hover:border-primary-light/50"
              }`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {layer.visible ? (
                      <FiEye size={16} className="text-primary-light" />
                    ) : (
                      <FiEyeOff size={16} className="text-gray-400" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                    {layer.name}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(layer.id);
                    }}
                    disabled={actualIndex === layers.length - 1}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                    title="Move Up"
                  >
                    <FiChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(layer.id);
                    }}
                    disabled={actualIndex === 0}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                    title="Move Down"
                  >
                    <FiChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Duplicate"
                  >
                    <FiCopy size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLayer(layer.id);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              {isActive && (
                <div className="space-y-2 mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                  <div>
                    <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 block">
                      Opacity: {layer.opacity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) =>
                        onUpdateOpacity(layer.id, Number(e.target.value))
                      }
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 block">
                      Blend Mode
                    </label>
                    <select
                      value={layer.blendMode}
                      onChange={(e) =>
                        onUpdateBlendMode(layer.id, e.target.value)
                      }
                      className="w-full px-2 py-1 text-xs bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {BLEND_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {actualIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMergeDown(layer.id);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      Merge Down
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerManager;
