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
import LayersPanel from "../components/LayersPanel";
import BrushSettings from "../components/BrushSettings";
import ColorPickerPanel from "../components/ColorPickerPanel";
import { useCanvas } from "../hooks/useCanvas";

const BRUSH_TYPES = {
  PENCIL: { name: "Pencil", icon: FiEdit3 },
  PEN: { name: "Pen", icon: FiPenTool },
  PAINTBRUSH: { name: "Brush", icon: FiFeather },
  MARKER: { name: "Marker", icon: FiEdit },
  AIRBRUSH: { name: "Airbrush", icon: FiWind },
  SMUDGE: { name: "Smudge", icon: FiSlash },
  ERASER: { name: "Eraser", icon: FiXCircle },
};

const SketchbookPro = ({
  embedded = false,
  gameModeProp = false,
  gameCodeProp = null,
  gameChainIdProp = null,
  gameRoundProp = null,
  gamePromptProp = null,
  gameNicknameProp = null,
  onGameSubmit = null,
}) => {
  const compositeCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Game mode state
  const [gameMode, setGameMode] = useState(gameModeProp);
  const [gameCode, setGameCode] = useState(gameCodeProp);
  const [gameChainId, setGameChainId] = useState(gameChainIdProp);
  const [gameRound, setGameRound] = useState(gameRoundProp);
  const [gamePrompt, setGamePrompt] = useState(gamePromptProp);
  const [gameNickname, setGameNickname] = useState(gameNicknameProp);

  // Canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [brushType, setBrushType] = useState("PAINTBRUSH");

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
  const [challengeId, setChallengeId] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // UI state
  const [title, setTitle] = useState("");
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
    if (embedded) {
      setGameMode(gameModeProp);
      setGameCode(gameCodeProp);
      setGameChainId(gameChainIdProp);
      setGameRound(gameRoundProp);
      setGamePrompt(gamePromptProp);
      setGameNickname(gameNicknameProp);
      return;
    }

    const params = new URLSearchParams(location.search);
    const remix = params.get("remix");
    const remixId = params.get("remixId");
    const challenge = params.get("challenge");
    const isGameMode = params.get("gameMode") === "true";
    const code = params.get("gameCode");
    const chainId = params.get("chainId");
    const round = params.get("round");
    const prompt = params.get("prompt");
    const nickname = params.get("nickname");

    setRemixImageUrl(remix || null);
    setRemixPostId(remixId || null);
    setChallengeId(challenge || null);

    if (isGameMode) {
      setGameMode(true);
      setGameCode(code);
      setGameChainId(parseInt(chainId));
      setGameRound(parseInt(round));
      setGamePrompt(prompt ? decodeURIComponent(prompt) : null);
      setGameNickname(nickname ? decodeURIComponent(nickname) : null);
    }
  }, [
    location.search,
    embedded,
    gameModeProp,
    gameCodeProp,
    gameChainIdProp,
    gameRoundProp,
    gamePromptProp,
    gameNicknameProp,
  ]);

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

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const {
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
  } = useCanvas({
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
  });

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

  const handleDownloadSource = async () => {
    if (!remixImageUrl) return;

    try {
      const response = await fetch(remixImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `remix-source-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Source image downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download source image");
      // Fallback to opening in new tab
      window.open(remixImageUrl, "_blank");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = mainCanvasRef.current;

        // Resize canvas to match the new image
        setCanvasWidth(img.width);
        setCanvasHeight(img.height);
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        // Clear the entire canvas first
        ctx.clearRect(0, 0, img.width, img.height);
        // Draw the new image filling the canvas
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Update the current layer data to match
        setLayers((prev) => {
          const newLayers = [...prev];
          const activeLayerIndex = newLayers.findIndex(
            (l) => l.id === activeLayerId
          );

          if (activeLayerIndex !== -1) {
            // Create a new canvas for the layer with the new dimensions
            const newLayerCanvas = document.createElement("canvas");
            newLayerCanvas.width = img.width;
            newLayerCanvas.height = img.height;
            const layerCtx = newLayerCanvas.getContext("2d");
            layerCtx.drawImage(img, 0, 0);

            // Replace the layer data
            newLayers[activeLayerIndex] = {
              ...newLayers[activeLayerIndex],
              data: newLayerCanvas,
            };
          }
          return newLayers;
        });

        // Reset zoom to fit the new image
        const viewportWidth = window.innerWidth - 320 - 320;
        const viewportHeight = window.innerHeight - 160;
        const zoomFactor = Math.min(
          viewportWidth / img.width,
          viewportHeight / img.height,
          1
        );
        if (zoomFactor > 0) {
          setZoom(zoomFactor);
        }

        saveToHistory();
        toast.success("Canvas replaced with uploaded image!");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  const handlePost = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to post your artwork");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      toast.error("Please add a title to your artwork");
      return;
    }

    setUploading(true);

    try {
      const canvas = mainCanvasRef.current;
      const imageData = canvas.toDataURL("image/png");
      const blob = dataURLtoBlob(imageData);
      const file = new File([blob], "artwork.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("title", title);
      formData.append("caption", caption);
      formData.append("image", file);
      if (remixPostId) formData.append("remixedFrom", remixPostId);

      const response = await postsAPI.createPost(formData);

      // If this is for a daily challenge, complete it
      if (challengeId && response.data._id) {
        try {
          const axios = (await import("axios")).default;
          await axios.post(`/api/challenges/${challengeId}/complete`, {
            postId: response.data._id,
          });
          toast.success("Daily challenge completed! 🎉");
        } catch (challengeError) {
          console.error("Challenge completion error:", challengeError);
          // Don't prevent navigation if challenge completion fails
        }
      }

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
      const blob = dataURLtoBlob(imageData);
      const file = new File([blob], "game-entry.png", { type: "image/png" });

      if (onGameSubmit) {
        await onGameSubmit(file);
        setUploading(false);
        return;
      }

      console.log("[SKETCHBOOK] Submitting to game:", {
        gameCode,
        gameNickname,
        gameChainId,
        gameRound,
      });

      // For standalone submission, we also need to use FormData if we update the API
      const formData = new FormData();
      formData.append("playerNickname", gameNickname);
      formData.append("chainId", gameChainId);
      formData.append("type", "drawing");
      formData.append("image", file);

      await gameAPI.submitEntry(gameCode, formData);

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
    <div className="h-[calc(100vh-80px)] bg-[#1a1a1a] text-gray-200 flex flex-col overflow-hidden font-sans">
      {/* Top Toolbar */}
      <div className="h-16 bg-[#252525] border-b border-[#333] px-6 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <FiEdit3 className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {gameMode ? "Game Challenge" : "Sketchbook Pro"}
            </h1>
          </div>

          {gameMode && gamePrompt && (
            <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center space-x-2">
              <span className="text-xs text-blue-400 uppercase tracking-wider font-semibold">
                Prompt:
              </span>
              <span className="text-sm font-medium text-blue-100">
                "{gamePrompt}"
              </span>
            </div>
          )}

          <div className="h-8 w-px bg-[#333] mx-2"></div>

          <div className="flex items-center space-x-1 bg-[#1a1a1a] rounded-lg p-1 border border-[#333]">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="p-2 rounded-md hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
              title="Undo (Ctrl+Z)"
            >
              <FiRotateCcw size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="p-2 rounded-md hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <FiRotateCw size={16} />
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-[#1a1a1a] rounded-lg p-1 border border-[#333]">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-md hover:bg-[#333] transition-colors text-gray-400 hover:text-white"
              title="Zoom Out"
            >
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs font-mono w-12 text-center text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-md hover:bg-[#333] transition-colors text-gray-400 hover:text-white"
              title="Zoom In"
            >
              <FiZoomIn size={16} />
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1 text-xs font-medium rounded-md hover:bg-[#333] transition-colors text-gray-400 hover:text-white"
              title="Reset View"
            >
              Reset
            </button>
          </div>

          {!remixImageUrl && (
            <button
              onClick={() => {
                setPendingWidth(canvasWidth);
                setPendingHeight(canvasHeight);
                setShowCanvasSettings((prev) => !prev);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-[#1a1a1a] border border-[#333] rounded-lg hover:bg-[#333] transition-colors text-gray-300"
            >
              Canvas Size
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {gameMode && !embedded && (
            <button
              onClick={() => navigate(`/game?code=${gameCode}&rejoin=true`)}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={clearCanvas}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Clear Canvas"
          >
            <FiTrash2 size={18} />
          </button>

          {remixImageUrl && (
            <button
              onClick={handleDownloadSource}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-[#333] rounded-lg transition-colors"
              title="Download Source Image"
            >
              <FiDownload size={18} />
            </button>
          )}

          <button
            onClick={handleUploadClick}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-[#333] rounded-lg transition-colors"
            title="Upload Image to Canvas"
          >
            <FiUpload size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
            title="Download Artwork"
          >
            <FiDownload size={18} />
          </button>
          {gameMode ? (
            <button
              onClick={handleSubmitToGame}
              disabled={uploading}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <FiUpload size={16} />
              <span>{uploading ? "Submitting..." : "Submit Entry"}</span>
            </button>
          ) : (
            <button
              onClick={handlePost}
              disabled={uploading}
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg shadow-lg shadow-purple-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              <FiUpload size={16} />
              <span>{uploading ? "Posting..." : "Post Art"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Settings Modal */}
        {showCanvasSettings && !remixImageUrl && (
          <div className="absolute z-50 top-4 left-1/2 -translate-x-1/2 bg-[#252525] border border-[#333] rounded-xl p-4 shadow-2xl flex items-end space-x-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">
                Width
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="256"
                  max="4096"
                  value={pendingWidth}
                  onChange={(e) => setPendingWidth(e.target.value)}
                  className="w-24 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  px
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">
                Height
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="256"
                  max="4096"
                  value={pendingHeight}
                  onChange={(e) => setPendingHeight(e.target.value)}
                  className="w-24 px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">
                  px
                </span>
              </div>
            </div>
            <button
              onClick={applyCanvasSize}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Left Sidebar - Tools */}
        <div className="w-72 bg-[#202020] border-r border-[#333] flex flex-col z-10 shadow-xl">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Tools Section */}
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-bold">
                Tools
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveTool("brush")}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    activeTool === "brush"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-gray-200"
                  }`}
                  title="Brush Tool"
                >
                  <FiFeather size={20} />
                </button>
                <button
                  onClick={() => setActiveTool("eyedropper")}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    activeTool === "eyedropper"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-gray-200"
                  }`}
                  title="Eyedropper"
                >
                  <FiDroplet size={20} />
                </button>
                <button
                  onClick={() => setActiveTool("pan")}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                    activeTool === "pan"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-gray-200"
                  }`}
                  title="Pan Tool"
                >
                  <FiMove size={20} />
                </button>
              </div>
            </div>

            {/* Brushes Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Brushes
                </h3>
                <button
                  onClick={() => setShowBrushSettings(!showBrushSettings)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showBrushSettings
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-[#333] text-gray-500"
                  }`}
                >
                  <FiSettings size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(BRUSH_TYPES).map(([key, brush]) => (
                  <button
                    key={key}
                    onClick={() => setBrushType(key)}
                    className={`p-3 rounded-xl border transition-all flex items-center space-x-3 ${
                      brushType === key
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-transparent bg-[#2a2a2a] text-gray-400 hover:bg-[#333] hover:text-gray-200"
                    }`}
                  >
                    <brush.icon size={18} />
                    <span className="text-xs font-medium">{brush.name}</span>
                  </button>
                ))}
              </div>

              {/* Brush Settings Expandable */}
              {showBrushSettings && (
                <BrushSettings
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  brushOpacity={brushOpacity}
                  setBrushOpacity={setBrushOpacity}
                  brushFlow={brushFlow}
                  setBrushFlow={setBrushFlow}
                />
              )}
            </div>

            {/* Color Picker Section */}
            <ColorPickerPanel
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              hsl={hsl}
              setHsl={setHsl}
              swatches={swatches}
              addSwatch={addSwatch}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#151515] relative overflow-hidden shadow-inner">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1f1f1f 25%, transparent 25%),
                linear-gradient(-45deg, #1f1f1f 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #1f1f1f 75%),
                linear-gradient(-45deg, transparent 75%, #1f1f1f 75%)
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
                    ? "grab"
                    : activeTool === "eyedropper"
                    ? "crosshair"
                    : "crosshair",
              }}
              onMouseDown={
                activeTool === "pan"
                  ? (e) => (e.target.style.cursor = "grabbing")
                  : null
              }
              onMouseUp={
                activeTool === "pan"
                  ? (e) => (e.target.style.cursor = "grab")
                  : null
              }
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
                className="shadow-2xl bg-white"
                style={{
                  touchAction: "none",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          </div>

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-6 left-6 bg-[#252525] border border-[#333] rounded-full px-4 py-2 shadow-lg flex items-center space-x-4 text-sm font-medium text-gray-400">
            <span>{Math.round(zoom * 100)}%</span>
            <div className="h-4 w-px bg-[#333]"></div>
            <span>
              {canvasWidth} x {canvasHeight}px
            </span>
          </div>
        </div>

        {/* Right Sidebar - Layers */}
        <div className="w-72 bg-[#202020] border-l border-[#333] flex flex-col z-10 shadow-xl">
          <LayersPanel
            layers={layers}
            activeLayerId={activeLayerId}
            setActiveLayerId={setActiveLayerId}
            addLayer={addLayer}
            toggleLayerVisibility={toggleLayerVisibility}
            duplicateLayer={duplicateLayer}
            deleteLayer={deleteLayer}
            updateLayerOpacity={updateLayerOpacity}
            updateLayerBlendMode={updateLayerBlendMode}
            mergeDown={mergeDown}
          />

          {/* Post Section (Bottom of Right Sidebar) */}
          {!gameMode && (
            <div className="p-4 border-t border-[#333] bg-[#1a1a1a]">
              <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-3 font-bold">
                Publish
              </h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="Artwork Title *"
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={500}
                    placeholder="Add a caption..."
                    className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333] rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SketchbookPro;
