import React from "react";
import {
  FiRotateCcw,
  FiRotateCw,
  FiTrash2,
  FiDownload,
  FiUpload,
  FiZoomIn,
  FiZoomOut,
  FiMove,
  FiSettings,
} from "react-icons/fi";

const Toolbar = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  onSubmit,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoom,
  activeTool,
  onToolChange,
  gameMode,
  uploading,
  showCanvasSettings,
  onToggleCanvasSettings,
}) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
      <div className="flex flex-wrap gap-2">
        {/* Undo/Redo */}
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <FiRotateCcw size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <FiRotateCw size={18} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button
            onClick={onZoomOut}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Zoom Out"
          >
            <FiZoomOut size={18} />
          </button>
          <button
            onClick={onResetView}
            className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-medium transition-colors"
            title="Reset View"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Zoom In"
          >
            <FiZoomIn size={18} />
          </button>
        </div>

        {/* Tools */}
        <div className="flex gap-1">
          <button
            onClick={() => onToolChange("brush")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "brush"
                ? "bg-primary-light text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            title="Brush Tool"
          >
            <FiEdit3 size={18} />
          </button>
          <button
            onClick={() => onToolChange("pan")}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === "pan"
                ? "bg-primary-light text-white"
                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            title="Pan Tool (Hold Space)"
          >
            <FiMove size={18} />
          </button>
        </div>

        {/* Canvas Settings */}
        <button
          onClick={onToggleCanvasSettings}
          className={`p-2 rounded-lg transition-colors ${
            showCanvasSettings
              ? "bg-primary-light text-white"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Canvas Settings"
        >
          <FiSettings size={18} />
        </button>

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={onClear}
            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            title="Clear Canvas"
          >
            <FiTrash2 size={18} />
          </button>
          <button
            onClick={onDownload}
            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
            title="Download"
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={onSubmit}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-primary-light text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title={gameMode ? "Submit to Game" : "Upload Art"}
          >
            {uploading ? (
              "Uploading..."
            ) : gameMode ? (
              "Submit"
            ) : (
              <>
                <FiUpload size={18} className="inline mr-1" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add missing import
import { FiEdit3 } from "react-icons/fi";

export default Toolbar;
