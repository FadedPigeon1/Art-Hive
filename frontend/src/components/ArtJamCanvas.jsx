import React, { useState, useRef, useEffect } from "react";
import { useCanvas } from "../hooks/useCanvas";
import { useJamSocket } from "../hooks/useJamSocket";
import { FiArrowLeft } from "react-icons/fi";

const ArtJamCanvas = ({ jamCode, nickname, userId, onLeave }) => {
  const [socket, setSocket] = useState(null);
  const [layers, setLayers] = useState([
    {
      id: 1,
      name: "Canvas",
      visible: true,
      opacity: 100,
      blendMode: "source-over",
      data: null,
    },
  ]);

  // Drawing State (Local)
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushFlow, setBrushFlow] = useState(100);
  const [brushType, setBrushType] = useState("PAINTBRUSH");
  const [activeTool, setActiveTool] = useState("BRUSH");

  // Remote Drawing State
  const remoteCanvasRef = useRef(null); // Canvas for remote strokes

  const handleRemoteStroke = (stroke) => {
    const canvas = remoteCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const { x, y, lastX, lastY, settings, brushType: type } = stroke;

    ctx.save();
    ctx.strokeStyle = settings.strokeStyle;
    ctx.lineWidth = settings.lineWidth;
    ctx.lineCap = settings.lineCap || "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = settings.shadowBlur;
    ctx.shadowColor = stroke.brushColor;

    if (type === "AIRBRUSH") {
      ctx.fillStyle = settings.strokeStyle;
      ctx.fillRect(x, y, settings.lineWidth, settings.lineWidth);
    } else {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  useJamSocket({
    setSocket,
    jamCode,
    nickname,
    userId,
    onRemoteStroke: handleRemoteStroke,
  });

  const handleLocalDraw = (strokeData) => {
    if (socket) {
      socket.emit("jam-draw-stroke", { code: jamCode, stroke: strokeData });
    }
  };

  const { mainCanvasRef, startDrawing, draw, stopDrawing } = useCanvas({
    layers,
    setLayers,
    activeLayerId: 1,
    activeTool,
    setActiveTool,
    brushColor,
    setBrushColor,
    brushSize,
    brushOpacity,
    brushFlow,
    brushType,
    saveToHistory: () => {},
    onDraw: handleLocalDraw,
  });

  // Initialize layers
  useEffect(() => {
    if (!layers[0].data) {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      setLayers((prev) => [{ ...prev[0], data: canvas }]);
    }
  }, []);

  // Composite rendering loop
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw local layer
      if (layers[0].data) {
        ctx.drawImage(layers[0].data, 0, 0);
      }

      // Draw remote layer
      if (remoteCanvasRef.current) {
        ctx.drawImage(remoteCanvasRef.current, 0, 0);
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [layers]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-white border-b flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Art Jam: {jamCode}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Logged in as: {nickname}
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-200 flex items-center justify-center">
        <div
          className="relative shadow-lg bg-white"
          style={{ width: 1200, height: 800 }}
        >
          <canvas
            ref={mainCanvasRef}
            width={1200}
            height={800}
            className="absolute top-0 left-0 cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {/* Hidden canvas for remote strokes */}
          <canvas
            ref={remoteCanvasRef}
            width={1200}
            height={800}
            className="pointer-events-none hidden"
          />
        </div>
      </div>

      {/* Simple Toolbar */}
      <div className="h-16 bg-white border-t flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold">Color</label>
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="h-8 w-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold">Size</label>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold">Tool</label>
          <select
            value={brushType}
            onChange={(e) => setBrushType(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="PENCIL">Pencil</option>
            <option value="PEN">Pen</option>
            <option value="PAINTBRUSH">Brush</option>
            <option value="MARKER">Marker</option>
            <option value="ERASER">Eraser</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ArtJamCanvas;
