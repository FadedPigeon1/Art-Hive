import React, { useRef, useState, useEffect, useCallback } from "react";
import { FiClock } from "react-icons/fi";
import { FaPen, FaEraser, FaTrash } from "react-icons/fa";

const COLORS = [
  "#000000",
  "#808080",
  "#FFFFFF",
  "#FF0000",
  "#FF7F00",
  "#FFFF00",
  "#00BB00",
  "#00AAAA",
  "#0055FF",
  "#8B00FF",
  "#FF69B4",
  "#8B4513",
  "#FFD700",
  "#00FA9A",
  "#FF4500",
  "#4169E1",
];

const BRUSH_SIZES = [
  { label: "S", px: 4 },
  { label: "M", px: 14 },
  { label: "L", px: 32 },
];

// Canvas resolution
const CANVAS_W = 800;
const CANVAS_H = 600;

const getPos = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const src = e.touches
    ? e.touches[0]
    : e.changedTouches
      ? e.changedTouches[0]
      : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top) * scaleY,
  };
};

const GameDrawCanvas = ({
  prompt,
  drawSeconds,
  currentRound,
  totalRounds,
  onSubmit,
  onLeave,
  hasSubmitted,
  submittedCount,
  totalPlayers,
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [color, setColor] = useState("#000000");
  const [brushIdx, setBrushIdx] = useState(1); // 0=S, 1=M, 2=L
  const [timeLeft, setTimeLeft] = useState(drawSeconds || 90);

  // Initialize white canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (hasSubmitted) return;
    if (timeLeft <= 0) return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit current canvas
          if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
              onSubmit(blob);
            }, "image/png");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [hasSubmitted, onSubmit]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}:${sec.toString().padStart(2, "0")}`;
    return `${s}s`;
  };

  const startDraw = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || hasSubmitted) return;
      const pos = getPos(e, canvas);
      setIsDrawing(true);
      setLastPos(pos);

      // Draw a dot on click
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BRUSH_SIZES[brushIdx].px / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.fill();
    },
    [hasSubmitted, color, tool, brushIdx],
  );

  const draw = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDrawing || hasSubmitted) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const pos = getPos(e, canvas);

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.lineWidth = BRUSH_SIZES[brushIdx].px;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      setLastPos(pos);
    },
    [isDrawing, hasSubmitted, lastPos, color, tool, brushIdx],
  );

  const stopDraw = useCallback((e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const handleSubmit = () => {
    if (!canvasRef.current || hasSubmitted) return;
    canvasRef.current.toBlob((blob) => {
      onSubmit(blob);
    }, "image/png");
  };

  const isUrgent = timeLeft <= 15;

  // Waiting screen
  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans">
        <div
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)] border-4 border-blue-800 p-8 text-center">
            <h2 className="text-3xl font-black text-blue-900 mb-4 uppercase tracking-wide">
              Drawing Submitted!
            </h2>
            <p className="text-blue-700 font-bold mb-6">
              Waiting for other players to finish...
            </p>
            <div className="inline-flex flex-col items-center w-full bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
              <div className="flex space-x-2 mb-2">
                {[...Array(totalPlayers)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 border-blue-900 ${i < submittedCount ? "bg-green-400" : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <span className="font-bold text-blue-800">
                {submittedCount}/{totalPlayers} submitted
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col font-sans overflow-hidden">
      {/* Fixed background dots */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={onLeave}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all"
        >
          Leave
        </button>
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">
            ROUND {currentRound}
          </h1>
          <div className="inline-block bg-yellow-400 text-blue-900 font-bold px-3 py-0.5 rounded-full border-2 border-blue-900 text-sm">
            {currentRound} / {totalRounds}
          </div>
        </div>
        <div
          className={`flex items-center gap-2 font-black text-xl px-4 py-2 rounded-xl border-2 shadow-md transition-colors ${
            isUrgent
              ? "bg-red-500 text-white border-red-700 animate-pulse"
              : "bg-white text-blue-900 border-blue-200"
          }`}
        >
          <FiClock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Prompt banner */}
      <div className="relative z-10 mx-3 mb-2 flex-shrink-0">
        <div className="bg-yellow-400 text-blue-900 rounded-2xl border-4 border-blue-900 px-5 py-3 text-center shadow-[4px_4px_0_rgba(30,58,138,0.5)]">
          <p className="text-xs font-black uppercase tracking-widest text-blue-700 mb-1">
            Draw this:
          </p>
          <p className="text-xl md:text-2xl font-black truncate">"{prompt}"</p>
        </div>
      </div>

      {/* Main drawing area */}
      <div className="relative z-10 flex flex-1 gap-2 px-3 pb-2 min-h-0">
        {/* Left toolbar */}
        <div className="flex flex-col items-center gap-2 bg-white rounded-2xl border-4 border-blue-800 p-2 shadow-lg flex-shrink-0">
          {/* Pen */}
          <button
            onClick={() => setTool("pen")}
            title="Pen"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${tool === "pen" ? "bg-blue-600 text-white border-blue-800 shadow-inner" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
          >
            <FaPen size={16} />
          </button>
          {/* Eraser */}
          <button
            onClick={() => setTool("eraser")}
            title="Eraser"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${tool === "eraser" ? "bg-blue-600 text-white border-blue-800 shadow-inner" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
          >
            <FaEraser size={16} />
          </button>

          <div className="w-full h-px bg-blue-200 my-1" />

          {/* Brush sizes */}
          {BRUSH_SIZES.map((b, i) => (
            <button
              key={b.label}
              onClick={() => setBrushIdx(i)}
              title={`Brush ${b.label}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all border-2 ${brushIdx === i ? "bg-blue-600 text-white border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"}`}
            >
              <div
                className="rounded-full bg-current"
                style={{
                  width: Math.max(4, b.px / 2.5),
                  height: Math.max(4, b.px / 2.5),
                }}
              />
            </button>
          ))}

          <div className="w-full h-px bg-blue-200 my-1" />

          {/* Clear */}
          <button
            onClick={clearCanvas}
            title="Clear canvas"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100 transition-all"
          >
            <FaTrash size={13} />
          </button>
        </div>

        {/* Canvas + color palette */}
        <div className="flex flex-col flex-1 gap-2 min-w-0">
          {/* Canvas */}
          <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border-4 border-blue-800 bg-white min-h-0">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full block cursor-crosshair touch-none"
              style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>

          {/* Bottom bar: colors + submit */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Color palette */}
            <div className="flex flex-wrap gap-1 bg-white rounded-2xl border-4 border-blue-800 p-2 shadow-lg flex-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool("pen");
                  }}
                  title={c}
                  className={`rounded-lg transition-transform hover:scale-110 flex-shrink-0 ${
                    color === c && tool === "pen"
                      ? "ring-2 ring-offset-1 ring-blue-800 scale-110"
                      : ""
                  } ${c === "#FFFFFF" ? "border border-gray-300" : ""}`}
                  style={{ backgroundColor: c, width: 28, height: 28 }}
                />
              ))}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              className="flex-shrink-0 px-6 py-4 bg-green-500 text-white rounded-2xl font-black text-lg uppercase tracking-wider border-b-8 border-green-700 hover:bg-green-400 active:border-b-0 active:translate-y-2 transition-all shadow-lg"
            >
              Submit!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDrawCanvas;
