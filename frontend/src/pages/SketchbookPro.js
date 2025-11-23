import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI, gameAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  FiTrash2,
  FiUpload,
  FiRotateCcw,
  FiRotateCw,
  FiDownload,
  FiLayers,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiPlus,
  FiMinus,
  FiZoomIn,
  FiZoomOut,
  FiMove,
  FiDroplet,
  FiSettings,
  FiEdit3,
  FiPenTool,
  FiFeather,
  FiEdit,
  FiWind,
  FiSlash,
  FiXCircle,
} from "react-icons/fi";

const BRUSH_TYPES = {
  PENCIL: { name: "Pencil", icon: FiEdit3 },
  PEN: { name: "Pen", icon: FiPenTool },
  PAINTBRUSH: { name: "Brush", icon: FiFeather },
  MARKER: { name: "Marker", icon: FiEdit },
  AIRBRUSH: { name: "Airbrush", icon: FiWind },
  SMUDGE: { name: "Smudge", icon: FiSlash },
  ERASER: { name: "Eraser", icon: FiXCircle },
};

const BLEND_MODES = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
];

const SketchbookPro = () => {
  const mainCanvasRef = useRef(null);
  const compositeCanvasRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Game mode state
  const [gameMode, setGameMode] = useState(false);
  const [gameCode, setGameCode] = useState(null);
  const [gameChainId, setGameChainId] = useState(null);
  const [gameRound, setGameRound] = useState(null);
  const [gamePrompt, setGamePrompt] = useState(null);
  const [gameNickname, setGameNickname] = useState(null);

  // Canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [brushType, setBrushType] = useState("PAINTBRUSH");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);

  // Layer management
  const [layers, setLayers] = useState([
    {
      id: 1,
      name: "Background",
      visible: true,
      opacity: 100,
      blendMode: "source-over",
      data: null,
      locked: false,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState(1);
  const [nextLayerId, setNextLayerId] = useState(2);

  // Color tools
  const [swatches, setSwatches] = useState([
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
  ]);
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });

  // Remix source (optional)
  const [remixImageUrl, setRemixImageUrl] = useState(null);
  const [remixPostId, setRemixPostId] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // UI state
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showColorPanel, setShowColorPanel] = useState(true);
  const [activeTool, setActiveTool] = useState("brush");
  const [showBrushSettings, setShowBrushSettings] = useState(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);

  const [pendingWidth, setPendingWidth] = useState(canvasWidth);
  const [pendingHeight, setPendingHeight] = useState(canvasHeight);

  // Read remix query param and game mode params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const remix = params.get("remix");
    const remixId = params.get("remixId");
    const isGameMode = params.get("gameMode") === "true";
    const code = params.get("gameCode");
    const chainId = params.get("chainId");
    const round = params.get("round");
    const prompt = params.get("prompt");
    const nickname = params.get("nickname");

    setRemixImageUrl(remix || null);
    setRemixPostId(remixId || null);

    if (isGameMode) {
      setGameMode(true);
      setGameCode(code);
      setGameChainId(parseInt(chainId));
      setGameRound(parseInt(round));
      setGamePrompt(prompt ? decodeURIComponent(prompt) : null);
      setGameNickname(nickname ? decodeURIComponent(nickname) : null);
    }
  }, [location.search]);

  // History management functions (defined early to avoid hoisting issues)
  const saveToHistory = useCallback(() => {
    setLayers((currentLayers) => {
      const snapshot = currentLayers.map((layer) => ({
        ...layer,
        data: layer.data ? layer.data.toDataURL() : null,
      }));

      setHistory((prevHistory) => {
        // Append snapshot and keep only last 50 entries
        const newHistory = [...prevHistory, snapshot].slice(-50);
        setHistoryStep(newHistory.length - 1);
        return newHistory;
      });

      return currentLayers;
    });
  }, []);

  // Initialize canvases (optionally with remix image as background)
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const baseWidth = canvasWidth;
    const baseHeight = canvasHeight;

    const initCanvas = (width, height, drawImageCb) => {
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = width;
      layerCanvas.height = height;
      const layerCtx = layerCanvas.getContext("2d");
      layerCtx.fillStyle = "#FFFFFF";
      layerCtx.fillRect(0, 0, width, height);

      if (drawImageCb) {
        drawImageCb(layerCtx, width, height);
      }

      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === 1 ? { ...layer, data: layerCanvas } : layer
        )
      );
      setTimeout(() => saveToHistory(), 100);
    };

    if (remixImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const imgW = img.width || baseWidth;
        const imgH = img.height || baseHeight;

        // Adapt canvas size to original artwork
        setCanvasWidth(imgW);
        setCanvasHeight(imgH);

        initCanvas(imgW, imgH, (layerCtx) => {
          layerCtx.drawImage(img, 0, 0, imgW, imgH);
        });

        // Fit on screen by adjusting zoom
        const viewportWidth = window.innerWidth - 320 - 320; // subtract sidebars
        const viewportHeight = window.innerHeight - 160; // subtract toolbars
        const zoomFactor = Math.min(
          viewportWidth / imgW,
          viewportHeight / imgH,
          1
        );
        if (zoomFactor > 0 && zoomFactor < 1) {
          setZoom(zoomFactor);
        }
      };
      img.onerror = () => {
        initCanvas(baseWidth, baseHeight);
      };
      img.src = remixImageUrl;
    } else {
      initCanvas(baseWidth, baseHeight);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remixImageUrl]);

  // Composite all layers
  const compositeAllLayers = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each visible layer
    layers.forEach((layer) => {
      if (!layer.visible || !layer.data) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.data, 0, 0);
      ctx.restore();
    });
  }, [layers, canvasWidth, canvasHeight]);

  useEffect(() => {
    compositeAllLayers();
  }, [layers, compositeAllLayers]);

  // Color conversion
  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const rgb = [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
    return `#${rgb.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  };

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Get brush settings
  const getBrushSettings = () => {
    const opacity = (brushOpacity / 100) * (brushFlow / 100);

    const settings = {
      PENCIL: {
        strokeStyle: hexToRgba(brushColor, opacity),
        lineWidth: brushSize * 0.5,
        shadowBlur: 0,
        hardness: 1,
      },
      PEN: {
        strokeStyle: hexToRgba(brushColor, opacity),
        lineWidth: brushSize * 0.7,
        shadowBlur: 0,
        hardness: 1,
      },
      PAINTBRUSH: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.8),
        lineWidth: brushSize,
        shadowBlur: brushSize * 0.1,
        hardness: 0.7,
      },
      MARKER: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.6),
        lineWidth: brushSize * 1.5,
        shadowBlur: 0,
        hardness: 0.5,
      },
      AIRBRUSH: {
        strokeStyle: hexToRgba(brushColor, opacity * 0.1),
        lineWidth: brushSize * 3,
        shadowBlur: brushSize * 2,
        hardness: 0.2,
      },
      SMUDGE: {
        strokeStyle: brushColor,
        lineWidth: brushSize,
        shadowBlur: 0,
        hardness: 0.5,
      },
      ERASER: {
        strokeStyle: "#FFFFFF",
        lineWidth: brushSize * 2,
        shadowBlur: 0,
        hardness: 1,
      },
    };

    return settings[brushType] || settings.PAINTBRUSH;
  };

  // Get coordinates with zoom and pan
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

    ctx.save();
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = settings.shadowBlur;
    ctx.shadowColor = brushColor;

    if (brushType === "AIRBRUSH") {
      // Spray effect
      for (let i = 0; i < 15; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize;
        const offsetY = (Math.random() - 0.5) * brushSize;
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
    } else {
      // Standard brush stroke
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

  // Layer management
  const addLayer = () => {
    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;

    const newLayer = {
      id: nextLayerId,
      name: `Layer ${nextLayerId}`,
      visible: true,
      opacity: 100,
      blendMode: "source-over",
      data: newCanvas,
      locked: false,
    };

    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(nextLayerId);
    setNextLayerId((prev) => prev + 1);
    toast.success("New layer created");
  };

  const deleteLayer = (layerId) => {
    if (layers.length === 1) {
      toast.error("Cannot delete the last layer");
      return;
    }

    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    if (activeLayerId === layerId) {
      setActiveLayerId(layers[0].id);
    }
    saveToHistory();
  };

  const duplicateLayer = (layerId) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;
    const newCtx = newCanvas.getContext("2d");
    if (layer.data) {
      newCtx.drawImage(layer.data, 0, 0);
    }

    const newLayer = {
      ...layer,
      id: nextLayerId,
      name: `${layer.name} copy`,
      data: newCanvas,
    };

    setLayers((prev) => [...prev, newLayer]);
    setNextLayerId((prev) => prev + 1);
    toast.success("Layer duplicated");
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const updateLayerOpacity = (layerId, opacity) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  };

  const updateLayerBlendMode = (layerId, blendMode) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, blendMode } : l))
    );
  };

  const mergeDown = (layerId) => {
    const layerIndex = layers.findIndex((l) => l.id === layerId);
    if (layerIndex === 0) {
      toast.error("Cannot merge down the bottom layer");
      return;
    }

    const currentLayer = layers[layerIndex];
    const belowLayer = layers[layerIndex - 1];

    if (!currentLayer.data || !belowLayer.data) return;

    const ctx = belowLayer.data.getContext("2d");
    ctx.save();
    ctx.globalAlpha = currentLayer.opacity / 100;
    ctx.globalCompositeOperation = currentLayer.blendMode;
    ctx.drawImage(currentLayer.data, 0, 0);
    ctx.restore();

    setLayers((prev) => prev.filter((l) => l.id !== layerId));
    toast.success("Layers merged");
    saveToHistory();
  };

  // Undo/Redo functions
  const restoreFromHistory = useCallback(
    (step) => {
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
        setLayers(restoredLayers);
      });
    },
    [history, canvasWidth, canvasHeight]
  );

  const undo = () => {
    if (historyStep > 0 && history.length > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && history.length > 0) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      restoreFromHistory(newStep);
    }
  };

  // Canvas operations
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
  };

  const applyCanvasSize = () => {
    const w = Math.max(
      256,
      Math.min(4096, Number(pendingWidth) || canvasWidth)
    );
    const h = Math.max(
      256,
      Math.min(4096, Number(pendingHeight) || canvasHeight)
    );

    setCanvasWidth(w);
    setCanvasHeight(h);

    const mainCanvas = mainCanvasRef.current;
    if (mainCanvas) {
      mainCanvas.width = w;
      mainCanvas.height = h;
    }

    const updatedLayers = layers.map((layer) => {
      if (!layer.data) return layer;
      const newCanvas = document.createElement("canvas");
      newCanvas.width = w;
      newCanvas.height = h;
      const ctx = newCanvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(layer.data, 0, 0);
      return { ...layer, data: newCanvas };
    });

    setLayers(updatedLayers);
    saveToHistory();
    setShowCanvasSettings(false);
  };

  const clearCanvas = () => {
    if (window.confirm("Clear the entire canvas? This cannot be undone.")) {
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (!activeLayer || !activeLayer.data) return;

      const ctx = activeLayer.data.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      setLayers((prev) => [...prev]);
      saveToHistory();
    }
  };

  // Add swatch
  const addSwatch = (color) => {
    if (!swatches.includes(color)) {
      setSwatches((prev) => [...prev, color]);
    }
  };

  // Export
  const handleDownload = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `artwork-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Artwork downloaded!");
  };

  const handlePost = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to post your artwork");
      navigate("/login");
      return;
    }

    setUploading(true);

    try {
      const canvas = mainCanvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      await postsAPI.createPost({
        imageUrl: imageData,
        caption,
        remixedFrom: remixPostId || undefined,
      });

      toast.success("Artwork posted successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to post artwork");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitToGame = async () => {
    if (!gameMode || !gameCode || !gameNickname) {
      toast.error("Invalid game session");
      return;
    }

    setUploading(true);

    try {
      const canvas = mainCanvasRef.current;
      const imageData = canvas.toDataURL("image/png");

      console.log("[SKETCHBOOK] Submitting to game:", {
        gameCode,
        gameNickname,
        gameChainId,
        gameRound,
      });

      await gameAPI.submitEntry(gameCode, {
        playerNickname: gameNickname,
        chainId: gameChainId,
        type: "drawing",
        data: imageData,
      });

      toast.success("Drawing submitted to game!");
      // Navigate back to game
      navigate(`/game?code=${gameCode}&rejoin=true`);
    } catch (error) {
      console.error("[SKETCHBOOK] Submit error:", error);
      toast.error(error.response?.data?.message || "Failed to submit drawing");
    } finally {
      setUploading(false);
    }
  };

  // Update color from HSL
  useEffect(() => {
    const color = hslToRgb(hsl.h, hsl.s, hsl.l);
    setBrushColor(color);
  }, [hsl]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            {gameMode ? "Game Drawing Challenge" : "Digital Sketchbook Pro"}
          </h1>

          {gameMode && gamePrompt && (
            <div className="px-4 py-2 bg-blue-900/50 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300 mb-1">Draw this prompt:</p>
              <p className="text-sm font-semibold italic">"{gamePrompt}"</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <FiRotateCcw size={18} />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="p-2 rounded hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <FiRotateCw size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-700 pl-4">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded hover:bg-gray-700"
              title="Zoom Out"
            >
              <FiZoomOut size={18} />
            </button>
            <span className="text-sm font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded hover:bg-gray-700"
              title="Zoom In"
            >
              <FiZoomIn size={18} />
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1 text-sm rounded hover:bg-gray-700"
              title="Reset View"
            >
              Reset
            </button>
            {!remixImageUrl && (
              <button
                onClick={() => {
                  setPendingWidth(canvasWidth);
                  setPendingHeight(canvasHeight);
                  setShowCanvasSettings((prev) => !prev);
                }}
                className="px-3 py-1 text-sm rounded hover:bg-gray-700"
                title="Canvas Size"
              >
                Canvas
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {gameMode && (
            <button
              onClick={() => navigate(`/game?code=${gameCode}&rejoin=true`)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-600 rounded hover:bg-gray-700"
            >
              <span className="text-sm">Cancel & Back to Game</span>
            </button>
          )}
          <button
            onClick={clearCanvas}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            <FiTrash2 size={16} />
            <span className="text-sm">Clear</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            <FiDownload size={16} />
            <span className="text-sm">Download</span>
          </button>
          {gameMode ? (
            <button
              onClick={handleSubmitToGame}
              disabled={uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              <FiUpload size={16} />
              <span className="text-sm">
                {uploading ? "Submitting..." : "Submit to Game"}
              </span>
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <FiUpload size={16} />
              <span className="text-sm">
                {uploading ? "Posting..." : "Post"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Settings Panel */}
        {showCanvasSettings && !remixImageUrl && (
          <div className="absolute z-20 top-20 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl flex space-x-4 items-end">
            <div>
              <label className="block text-xs mb-1">Width (px)</label>
              <input
                type="number"
                min="256"
                max="4096"
                value={pendingWidth}
                onChange={(e) => setPendingWidth(e.target.value)}
                className="w-24 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Height (px)</label>
              <input
                type="number"
                min="256"
                max="4096"
                value={pendingHeight}
                onChange={(e) => setPendingHeight(e.target.value)}
                className="w-24 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
              />
            </div>
            <button
              onClick={applyCanvasSize}
              className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        )}
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Brush Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center justify-between">
                Brush Type
                <button
                  onClick={() => setShowBrushSettings(!showBrushSettings)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <FiSettings size={14} />
                </button>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(BRUSH_TYPES).map(([key, brush]) => (
                  <button
                    key={key}
                    onClick={() => setBrushType(key)}
                    className={`p-3 rounded border-2 transition-all ${
                      brushType === key
                        ? "border-blue-500 bg-blue-900/30"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-center">
                      <brush.icon size={18} />
                    </div>
                    <div className="text-xs">{brush.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Brush Settings */}
            {showBrushSettings && (
              <div className="space-y-3 bg-gray-700/50 p-3 rounded">
                <div>
                  <label className="text-xs">Size: {brushSize}px</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs">Opacity: {brushOpacity}%</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushOpacity}
                    onChange={(e) => setBrushOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs">Flow: {brushFlow}%</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={brushFlow}
                    onChange={(e) => setBrushFlow(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Tools */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTool("brush")}
                  className={`p-2 rounded flex flex-col items-center ${
                    activeTool === "brush"
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <FiFeather size={20} className="mb-1" />
                  <span className="text-xs">Brush</span>
                </button>
                <button
                  onClick={() => setActiveTool("eyedropper")}
                  className={`p-2 rounded flex flex-col items-center ${
                    activeTool === "eyedropper"
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <FiDroplet size={20} className="mb-1" />
                  <span className="text-xs">Eyedropper</span>
                </button>
                <button
                  onClick={() => setActiveTool("pan")}
                  className={`p-2 rounded flex flex-col items-center ${
                    activeTool === "pan"
                      ? "bg-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <FiMove size={20} className="mb-1" />
                  <span className="text-xs">Pan</span>
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="flex flex-col max-h-72 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2 flex-none">Color</h3>
              <div className="space-y-3 flex-1">
                {/* Current Color */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-16 h-16 rounded border-2 border-gray-600"
                    style={{ backgroundColor: brushColor }}
                  />
                  <div className="flex-1">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => {
                        setBrushColor(e.target.value);
                        addSwatch(e.target.value);
                      }}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* HSL Sliders */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs">Hue: {hsl.h}°</label>
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
                      className="w-full"
                      style={{
                        background: `linear-gradient(to right, 
                          hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                          hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), 
                          hsl(360, 100%, 50%))`,
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs">Saturation: {hsl.s}%</label>
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
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Lightness: {hsl.l}%</label>
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
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Swatches */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold">Swatches</label>
                    <button
                      onClick={() => addSwatch(brushColor)}
                      className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    >
                      <FiPlus size={12} className="inline" /> Add
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {swatches.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBrushColor(color)}
                        className={`w-8 h-8 rounded border-2 ${
                          brushColor === color
                            ? "border-white"
                            : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-700 relative overflow-hidden">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #808080 25%, transparent 25%),
                linear-gradient(-45deg, #808080 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #808080 75%),
                linear-gradient(-45deg, transparent 75%, #808080 75%)
              `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center",
                cursor:
                  activeTool === "pan"
                    ? "move"
                    : activeTool === "eyedropper"
                    ? "crosshair"
                    : "crosshair",
              }}
            >
              <canvas
                ref={mainCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="shadow-2xl"
                style={{
                  touchAction: "none",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Layers */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center">
                <FiLayers className="mr-2" /> Layers
              </h3>
              <button
                onClick={addLayer}
                className="p-1 bg-blue-600 rounded hover:bg-blue-700"
                title="New Layer"
              >
                <FiPlus size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {[...layers].reverse().map((layer) => (
                <div
                  key={layer.id}
                  className={`p-2 rounded border-2 ${
                    activeLayerId === layer.id
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onClick={() => setActiveLayerId(layer.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate">
                      {layer.name}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        {layer.visible ? (
                          <FiEye size={14} />
                        ) : (
                          <FiEyeOff size={14} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateLayer(layer.id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
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
                          className="p-1 hover:bg-red-600 rounded"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layer Opacity */}
                  <div className="mb-2">
                    <label className="text-xs">Opacity: {layer.opacity}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layer.opacity}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateLayerOpacity(layer.id, Number(e.target.value));
                      }}
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Blend Mode */}
                  <div>
                    <label className="text-xs">Blend Mode:</label>
                    <select
                      value={layer.blendMode}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateLayerBlendMode(layer.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-1 py-1 mt-1"
                    >
                      {BLEND_MODES.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Merge Down Button */}
                  {layers.indexOf(layer) > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        mergeDown(layer.id);
                      }}
                      className="w-full mt-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      Merge Down
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Post Section */}
      {!gameMode && (
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-end space-x-3">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="Describe your artwork..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <p className="text-xs text-gray-400 mt-1">{caption.length}/500</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SketchbookPro;
