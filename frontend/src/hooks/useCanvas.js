import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useSketchbookStore } from "../store/useSketchbookStore";

export const useCanvas = ({ saveToHistory, onDraw }) => {
  const {
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
    zoom,
    setZoom,
    symmetryConfig,
    setSymmetryConfig,
  } = useSketchbookStore();

  const mainCanvasRef = useRef(null);

  // View State
  // zoom is managed by store
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [isDraggingSymmetry, setIsDraggingSymmetry] = useState(false);

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
      CHARCOAL: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.6),
        lineWidth: brushSize,
        shadowBlur: brushSize * 0.5,
        lineCap: "butt",
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
      if (activeTool === "pan" && e.shiftKey) {
        // Just for extra way to move symmetry? No, let's just make it if activeTool is symmetry-pan or something. Wait, user can just use 'pan' tool but we check distance to symmetry axis? The prompt said: "Update the Pan tool behavior so users can click and drag the axis center to new coordinates."
      }
      // I'll intercept this inside
    }

    if (activeTool === "pan") {
      const coords = getCanvasCoords(e);
      if (symmetryConfig && symmetryConfig.mode !== "none") {
        // if within 50px of axis center... wait, we only need to update axisX/axisY. Let's just make clicking anywhere with pan tool move the axis IF symmetry is on? No, clicking and dragging.
        // Let's check distance to current axis
        const distX = Math.abs(coords.x - symmetryConfig.axisX);
        const distY = Math.abs(coords.y - symmetryConfig.axisY);
        const isNearAxis =
          (symmetryConfig.mode === "vertical" && distX < 50) ||
          (symmetryConfig.mode === "horizontal" && distY < 50) ||
          (symmetryConfig.mode === "radial" && distX < 50 && distY < 50);

        if (isNearAxis) {
          setIsDraggingSymmetry(true);
          return;
        }
      }

      setIsPanning(true);
      const rect = mainCanvasRef.current.getBoundingClientRect();
      setLastPanPoint({
        x: (e.clientX || e.touches[0]?.clientX) - rect.left,
        y: (e.clientY || e.touches[0]?.clientY) - rect.top,
      });
      return;
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
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
      // Initialize smudge tool - capture initial area
      // No-op for new smudge logic as it samples continuously
    }
  };

  const draw = (e) => {
    e.preventDefault();

    if (isDraggingSymmetry) {
      const coords = getCanvasCoords(e);
      if (symmetryConfig.mode === "vertical")
        setSymmetryConfig({ axisX: coords.x });
      else if (symmetryConfig.mode === "horizontal")
        setSymmetryConfig({ axisY: coords.y });
      else setSymmetryConfig({ axisX: coords.x, axisY: coords.y });
      return;
    }

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

    const pointsToDraw = [{ coords, last: lastPoint }];

    // Symmetry logic
    if (symmetryConfig && symmetryConfig.mode !== "none") {
      const axisX = symmetryConfig.axisX;
      const axisY = symmetryConfig.axisY;

      const mirrorPoint = (pt, type) => {
        if (!pt) return null;
        if (type === "vertical") return { x: axisX + (axisX - pt.x), y: pt.y };
        if (type === "horizontal")
          return { x: pt.x, y: axisY + (axisY - pt.y) };
        if (type === "radial")
          return { x: axisX + (axisX - pt.x), y: axisY + (axisY - pt.y) };
        return pt;
      };

      if (
        symmetryConfig.mode === "vertical" ||
        symmetryConfig.mode === "horizontal" ||
        symmetryConfig.mode === "radial"
      ) {
        pointsToDraw.push({
          coords: mirrorPoint(coords, symmetryConfig.mode),
          last: mirrorPoint(lastPoint, symmetryConfig.mode),
        });
      }
      if (symmetryConfig.mode === "radial") {
        // Radial actually gives 4 quadrants usually. If mode is radial, wait do we want 4 quadrants or just 180 degrees?
        // Let's do 4 quadrant mirroring for 'radial'
        pointsToDraw.push({
          coords: mirrorPoint(coords, "vertical"),
          last: mirrorPoint(lastPoint, "vertical"),
        });
        pointsToDraw.push({
          coords: mirrorPoint(coords, "horizontal"),
          last: mirrorPoint(lastPoint, "horizontal"),
        });
      }
    }

    ctx.save();
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.lineCap = settings.lineCap || "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = settings.shadowBlur;
    ctx.shadowColor = brushColor;

    pointsToDraw.forEach(({ coords: c, last: l }) => {
      // Re-apply in case it was altered
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (brushType === "AIRBRUSH") {
        const density = brushSize * 2;
        for (let i = 0; i < density; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSize * Math.random();
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;

          ctx.fillStyle = settings.strokeStyle;
          const dotSize = Math.random() * 1.5 + 0.5;
          ctx.globalAlpha = Math.random() * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(c.x + offsetX, c.y + offsetY, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (brushType === "CHARCOAL") {
        const steps = Math.ceil(Math.hypot(c.x - l.x, c.y - l.y));
        const stepX = steps > 0 ? (c.x - l.x) / steps : 0;
        const stepY = steps > 0 ? (c.y - l.y) / steps : 0;

        for (let i = 0; i < steps; i++) {
          const x = l.x + stepX * i;
          const y = l.y + stepY * i;
          const scratches = 5;
          for (let j = 0; j < scratches; j++) {
            const offsetX = (Math.random() - 0.5) * brushSize;
            const offsetY = (Math.random() - 0.5) * brushSize;
            const size = Math.random() * 2 + 1;

            ctx.fillStyle = settings.strokeStyle;
            ctx.globalAlpha = Math.random() * 0.3 + 0.1;
            ctx.fillRect(x + offsetX, y + offsetY, size, size);
          }
        }
      } else if (brushType === "SMUDGE") {
        const sampleSize = brushSize * 2;
        const sampleX = l.x - brushSize;
        const sampleY = l.y - brushSize;
        try {
          const imageData = ctx.getImageData(
            sampleX,
            sampleY,
            sampleSize,
            sampleSize,
          );
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = sampleSize;
          tempCanvas.height = sampleSize;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.putImageData(imageData, 0, 0);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(tempCanvas, c.x - brushSize, c.y - brushSize);
        } catch (e) {}
      } else if (brushType === "MARKER") {
        ctx.globalCompositeOperation = "multiply";
        ctx.beginPath();
        if (l) {
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(c.x, c.y);
        } else {
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x, c.y);
        }
        ctx.stroke();
      } else if (brushType === "PENCIL") {
        ctx.beginPath();
        if (l) {
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(c.x, c.y);
        } else {
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x, c.y);
        }
        ctx.stroke();
        const distance = Math.hypot(
          c.x - (l ? l.x : c.x),
          c.y - (l ? l.y : c.y),
        );
        const grains = Math.floor(distance * 0.5);
        ctx.fillStyle = settings.strokeStyle;
        for (let i = 0; i < grains; i++) {
          const t = Math.random();
          const x = l.x + (c.x - l.x) * t;
          const y = l.y + (c.y - l.y) * t;
          const offsetX = (Math.random() - 0.5) * brushSize * 0.5;
          const offsetY = (Math.random() - 0.5) * brushSize * 0.5;
          ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
      } else {
        ctx.beginPath();
        if (l) {
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(c.x, c.y);
        } else {
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x, c.y);
        }
        ctx.stroke();
      }
    });

    ctx.restore();
    setLastPoint(coords);

    // Update composite
    setLayers((prev) => [...prev]);
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();

    if (isDraggingSymmetry) {
      setIsDraggingSymmetry(false);
      return;
    }

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
