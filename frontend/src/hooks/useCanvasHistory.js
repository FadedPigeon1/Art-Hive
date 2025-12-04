import { useState, useCallback } from "react";

/**
 * Custom hook for managing canvas history (undo/redo)
 */
export const useCanvasHistory = (canvasWidth, canvasHeight) => {
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveToHistory = useCallback(
    (currentLayers) => {
      const snapshot = currentLayers.map((layer) => ({
        ...layer,
        data: layer.data ? layer.data.toDataURL() : null,
      }));

      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyStep + 1);
        return [...newHistory, snapshot].slice(-50); // Keep last 50 states
      });

      setHistoryStep((prev) => Math.min(prev + 1, 49));
    },
    [historyStep]
  );

  const restoreFromHistory = useCallback(
    (step, callback) => {
      if (!history || !history[step]) {
        console.warn("No history available for step:", step);
        return;
      }

      const snapshot = history[step];

      // Create promises for all image loads
      const loadPromises = snapshot.map((layer) => {
        return new Promise((resolve) => {
          if (!layer.data) {
            resolve({ ...layer, data: null });
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext("2d");

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve({ ...layer, data: canvas });
          };
          img.onerror = () => {
            console.error("Failed to load layer image");
            resolve({ ...layer, data: null });
          };
          img.src = layer.data;
        });
      });

      // Wait for all images to load before updating layers
      Promise.all(loadPromises).then((restoredLayers) => {
        callback(restoredLayers);
      });
    },
    [history, canvasWidth, canvasHeight]
  );

  const undo = (callback) => {
    if (historyStep > 0 && history.length > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep, callback);
    }
  };

  const redo = (callback) => {
    if (historyStep < history.length - 1 && history.length > 0) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep, callback);
    }
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyStep,
  };
};
