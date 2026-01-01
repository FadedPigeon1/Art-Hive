import { create } from "zustand";
import {
  FiEdit3,
  FiPenTool,
  FiFeather,
  FiEdit,
  FiWind,
  FiSlash,
  FiXCircle,
  FiCloud,
} from "react-icons/fi";

export const BRUSH_TYPES = {
  PENCIL: { name: "Pencil", icon: FiEdit3 },
  PEN: { name: "Pen", icon: FiPenTool },
  PAINTBRUSH: { name: "Brush", icon: FiFeather },
  MARKER: { name: "Marker", icon: FiEdit },
  AIRBRUSH: { name: "Airbrush", icon: FiWind },
  CHARCOAL: { name: "Charcoal", icon: FiCloud },
  SMUDGE: { name: "Smudge", icon: FiSlash },
  ERASER: { name: "Eraser", icon: FiXCircle },
};

export const useSketchbookStore = create((set, get) => ({
  // Canvas Dimensions
  canvasWidth: 1200,
  canvasHeight: 800,
  setCanvasSize: (width, height) =>
    set({ canvasWidth: width, canvasHeight: height }),
  setCanvasWidth: (width) => set({ canvasWidth: width }),
  setCanvasHeight: (height) => set({ canvasHeight: height }),

  // Brush State
  brushColor: "#000000",
  brushSize: 5,
  brushOpacity: 100,
  brushFlow: 100,
  brushType: "PAINTBRUSH",
  activeTool: "brush",

  setBrushColor: (color) => set({ brushColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),
  setBrushFlow: (flow) => set({ brushFlow: flow }),
  setBrushType: (type) => set({ brushType: type }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Color Tools
  swatches: [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#8B4513",
    "#A52A2A",
    "#DEB887",
    "#5F9EA0",
    "#7FFF00",
    "#D2691E",
    "#FF7F50",
  ],
  hsl: { h: 0, s: 100, l: 50 },
  setSwatches: (val) =>
    set((state) => ({
      swatches: typeof val === "function" ? val(state.swatches) : val,
    })),
  addSwatch: (color) =>
    set((state) => ({ swatches: [...state.swatches, color] })),
  setHsl: (val) =>
    set((state) => ({ hsl: typeof val === "function" ? val(state.hsl) : val })),

  // Layer State
  layers: [
    {
      id: 1,
      name: "Background",
      visible: true,
      opacity: 100,
      blendMode: "source-over",
      data: null,
      locked: false,
    },
  ],
  activeLayerId: 1,
  nextLayerId: 2,

  setLayers: (val) =>
    set((state) => ({
      layers: typeof val === "function" ? val(state.layers) : val,
    })),
  setActiveLayerId: (id) => set({ activeLayerId: id }),

  addLayer: () =>
    set((state) => {
      const newId = state.nextLayerId;
      const newLayer = {
        id: newId,
        name: `Layer ${state.layers.length + 1}`,
        visible: true,
        opacity: 100,
        blendMode: "source-over",
        data: null,
        locked: false,
      };
      // Add to top (beginning of array)
      return {
        layers: [newLayer, ...state.layers],
        activeLayerId: newId,
        nextLayerId: newId + 1,
      };
    }),

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  updateLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),

  updateLayerBlendMode: (id, blendMode) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, blendMode } : l)),
    })),

  duplicateLayer: (id) =>
    set((state) => {
      const layer = state.layers.find((l) => l.id === id);
      if (!layer) return state;

      const newCanvas = document.createElement("canvas");
      newCanvas.width = state.canvasWidth;
      newCanvas.height = state.canvasHeight;
      const newCtx = newCanvas.getContext("2d");
      if (layer.data) {
        newCtx.drawImage(layer.data, 0, 0);
      }

      const newId = state.nextLayerId;
      const newLayer = {
        ...layer,
        id: newId,
        name: `${layer.name} copy`,
        data: newCanvas,
      };

      return {
        layers: [...state.layers, newLayer],
        nextLayerId: newId + 1,
      };
    }),

  mergeDown: (id) =>
    set((state) => {
      const layerIndex = state.layers.findIndex((l) => l.id === id);
      if (layerIndex <= 0) return state; // Cannot merge bottom layer

      const currentLayer = state.layers[layerIndex];
      const belowLayer = state.layers[layerIndex - 1];

      const newCanvas = document.createElement("canvas");
      newCanvas.width = state.canvasWidth;
      newCanvas.height = state.canvasHeight;
      const ctx = newCanvas.getContext("2d");

      // Draw below layer
      if (belowLayer.data) {
        ctx.globalAlpha = belowLayer.opacity / 100;
        ctx.globalCompositeOperation = belowLayer.blendMode;
        ctx.drawImage(belowLayer.data, 0, 0);
      }

      // Draw current layer
      if (currentLayer.data) {
        ctx.globalAlpha = currentLayer.opacity / 100;
        ctx.globalCompositeOperation = currentLayer.blendMode;
        ctx.drawImage(currentLayer.data, 0, 0);
      }

      const mergedLayer = {
        ...belowLayer,
        name: `Merged ${belowLayer.name}`,
        data: newCanvas,
        opacity: 100,
        blendMode: "source-over",
      };

      const newLayers = [...state.layers];
      newLayers.splice(layerIndex - 1, 2, mergedLayer); // Remove both, insert merged

      return {
        layers: newLayers,
        activeLayerId: mergedLayer.id,
      };
    }),

  deleteLayer: (id) =>
    set((state) => {
      if (state.layers.length <= 1) return state; // Don't delete last layer
      const newLayers = state.layers.filter((l) => l.id !== id);
      // If we deleted the active layer, set active to the first one
      const newActiveId =
        state.activeLayerId === id ? newLayers[0].id : state.activeLayerId;
      return {
        layers: newLayers,
        activeLayerId: newActiveId,
      };
    }),

  reorderLayers: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.layers);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { layers: result };
    }),

  // View State
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),

  // Reset Store (useful when leaving the page)
  resetStore: () =>
    set({
      canvasWidth: 1200,
      canvasHeight: 800,
      brushColor: "#000000",
      brushSize: 5,
      brushOpacity: 100,
      brushFlow: 100,
      brushType: "PAINTBRUSH",
      layers: [
        {
          id: 1,
          name: "Background",
          visible: true,
          opacity: 100,
          blendMode: "source-over",
          data: null,
          locked: false,
        },
      ],
      activeLayerId: 1,
      nextLayerId: 2,
      zoom: 1,
    }),
}));
