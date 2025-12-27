import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";

export const useCanvas = ({
  layers,
  setLayers,
  activeLayerId,
  activeTool,
  setActiveTool,
  brushColor,
  setBrushColor,
  brushSize,
  brushOpacity,
  brushFlow,
  brushType,
  saveToHistory,
  onDraw,
}) => {
  const mainCanvasRef = useRef(null);

  // View State
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);

  // Helper: Get coordinates with zoom and pan
  const getCanvasCoords = (e) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;

    return { x, y };
  };

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper: Get brush settings
  const getBrushSettings = () => {
    const opacity = (brushOpacity / 100) * (brushFlow / 100);

    const settings = {
      PENCIL: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.8), // Slightly transparent for buildup
        lineWidth: Math.max(1, brushSize * 0.5), // Thinner than others
        shadowBlur: 0,
        lineCap: "round",
      },
      PEN: {
        strokeStyle: hexToRgba(brushColor, opacity),
        lineWidth: brushSize * 0.8,
        shadowBlur: 0,
        lineCap: "round",
      },
      PAINTBRUSH: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.9),
        lineWidth: brushSize,
        shadowBlur: brushSize * 0.2, // Soft edges
        lineCap: "round",
      },
      MARKER: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.5), // Very transparent for layering
        lineWidth: brushSize * 2,
        shadowBlur: 0,
        lineCap: "square", // Chisel tip feel
      },
      AIRBRUSH: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.2),
        lineWidth: brushSize * 3,
        shadowBlur: brushSize * 2,
        lineCap: "round",
      },
      SMUDGE: {
        strokeStyle: brushColor,
        lineWidth: brushSize,
        shadowBlur: 0,
        lineCap: "round",
      },
      ERASER: {
        strokeStyle: "#FFFFFF",
        lineWidth: brushSize * 2,
        shadowBlur: 0,
        lineCap: "round",
      },
    };

    return settings[brushType] || settings.PAINTBRUSH;
  };

  // Pick color from canvas
  const pickColor = (e) => {
    const coords = getCanvasCoords(e);
    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
    const hex = `#${[pixel[0], pixel[1], pixel[2]]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
    setBrushColor(hex);
    setActiveTool("brush");
    toast.success(`Color picked: ${hex}`);
  };

  // Drawing functions
  const startDrawing = (e) => {
    e.preventDefault();

    if (
      activeTool === "pan" ||
      e.button === 1 ||
      (e.button === 0 && e.altKey)
    ) {
      setIsPanning(true);
      const rect = mainCanvasRef.current.getBoundingClientRect();
      setLastPanPoint({
        x: (e.clientX || e.touches[0]?.clientX) - rect.left,
        y: (e.clientY || e.touches[0]?.clientY) - rect.top,
      });
      return;
    }

    if (activeTool === "eyedropper") {
      pickColor(e);
      return;
    }

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) {
      toast.warning("Cannot draw on locked or invisible layer");
      return;
    }

    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    setLastPoint(coords);

    if (brushType === "SMUDGE") {
      // Initialize smudge tool
      const ctx = activeLayer.data.getContext("2d");
      const imageData = ctx.getImageData(
        coords.x - brushSize,
        coords.y - brushSize,
        brushSize * 2,
        brushSize * 2
      );
      setLastPoint({ ...coords, imageData });
    }
  };

  const draw = (e) => {
    e.preventDefault();

    if (isPanning) {
      const rect = mainCanvasRef.current.getBoundingClientRect();
      const currentX = (e.clientX || e.touches[0]?.clientX) - rect.left;
      const currentY = (e.clientY || e.touches[0]?.clientY) - rect.top;

      setPanOffset((prev) => ({
        x: prev.x + (currentX - lastPanPoint.x),
        y: prev.y + (currentY - lastPanPoint.y),
      }));

      setLastPanPoint({ x: currentX, y: currentY });
      return;
    }

    if (!isDrawing) return;

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.data) return;

    const ctx = activeLayer.data.getContext("2d");
    const coords = getCanvasCoords(e);
    const settings = getBrushSettings();

    if (onDraw) {
      onDraw({
        x: coords.x,
        y: coords.y,
        lastX: lastPoint ? lastPoint.x : coords.x,
        lastY: lastPoint ? lastPoint.y : coords.y,
        settings,
        brushType,
        brushSize,
        brushColor,
      });
    }

    ctx.save();
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.lineCap = settings.lineCap || "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = settings.shadowBlur;
    ctx.shadowColor = brushColor;

    if (brushType === "AIRBRUSH") {
      // Spray effect
      for (let i = 0; i < brushSize * 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * brushSize;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        ctx.fillStyle = settings.strokeStyle;
        ctx.fillRect(coords.x + offsetX, coords.y + offsetY, 1, 1);
      }
    } else if (brushType === "SMUDGE" && lastPoint.imageData) {
      // Smudge effect
      ctx.putImageData(
        lastPoint.imageData,
        coords.x - brushSize,
        coords.y - brushSize
      );
      const newImageData = ctx.getImageData(
        coords.x - brushSize,
        coords.y - brushSize,
        brushSize * 2,
        brushSize * 2
      );
      setLastPoint({ ...coords, imageData: newImageData });
    } else if (brushType === "MARKER") {
      // Marker effect - Multiply blending for buildup
      ctx.globalCompositeOperation = "multiply";
      ctx.beginPath();
      if (lastPoint) {
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
      } else {
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x, coords.y);
      }
      ctx.stroke();
      // Reset composite operation is handled by ctx.restore()
    } else if (brushType === "PENCIL") {
      // Pencil effect - slightly rougher
      ctx.beginPath();
      if (lastPoint) {
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
      } else {
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x, coords.y);
      }
      ctx.stroke();

      // Add noise for texture
      if (Math.random() > 0.5) {
        const noiseX = (Math.random() - 0.5) * 2;
        const noiseY = (Math.random() - 0.5) * 2;
        ctx.fillStyle = settings.strokeStyle;
        ctx.fillRect(coords.x + noiseX, coords.y + noiseY, 1, 1);
      }
    } else {
      // Standard brush stroke (Pen, Paintbrush, Eraser)
      ctx.beginPath();
      if (lastPoint) {
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
      } else {
        ctx.moveTo(coords.x, coords.y);
        ctx.lineTo(coords.x, coords.y);
      }
      ctx.stroke();
    }

    ctx.restore();
    setLastPoint(coords);

    // Update composite
    setLayers((prev) => [...prev]);
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      saveToHistory();
    }
  };

  // View Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  return {
    mainCanvasRef,
    zoom,
    setZoom,
    rotation,
    setRotation,
    panOffset,
    setPanOffset,
    isPanning,
    startDrawing,
    draw,
    stopDrawing,
    handleZoomIn,
    handleZoomOut,
    resetView,
    getCanvasCoords,
    activeTool, // Return activeTool in case it was modified (e.g. by pickColor)
  };
};
