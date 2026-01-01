/**
 * Custom hook for brush engine settings and utilities
 */
export const useBrushEngine = () => {
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getBrushSettings = (
    brushType,
    brushColor,
    brushOpacity,
    brushFlow,
    brushSize
  ) => {
    const opacity = (brushOpacity / 100) * (brushFlow / 100);
    const color = hexToRgba(brushColor, opacity);

    switch (brushType) {
      case "PENCIL":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: Math.max(1, brushSize * 0.5),
          strokeStyle: color,
          globalCompositeOperation: "source-over",
          shadowBlur: 0,
        };

      case "PEN":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: color,
          globalCompositeOperation: "source-over",
          shadowBlur: 0,
        };

      case "PAINTBRUSH":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: color,
          globalCompositeOperation: "source-over",
          shadowBlur: brushSize * 0.2,
          shadowColor: color,
        };

      case "MARKER":
        return {
          lineCap: "square",
          lineJoin: "round",
          lineWidth: brushSize * 1.5,
          strokeStyle: hexToRgba(brushColor, opacity * 0.5),
          globalCompositeOperation: "multiply",
          shadowBlur: 0,
        };

      case "AIRBRUSH":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize * 2,
          strokeStyle: hexToRgba(brushColor, opacity * 0.2),
          globalCompositeOperation: "source-over",
          shadowBlur: brushSize * 0.8,
          shadowColor: color,
        };

      case "CHARCOAL":
        return {
          lineCap: "butt",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: hexToRgba(brushColor, opacity * 0.6),
          globalCompositeOperation: "source-over",
          shadowBlur: brushSize * 0.5,
          shadowColor: color,
        };

      case "SMUDGE":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: "rgba(0,0,0,0)", // Transparent stroke for smudge
          globalCompositeOperation: "source-over",
          shadowBlur: 0,
        };

      case "ERASER":
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: "rgba(255, 255, 255, 1)",
          globalCompositeOperation: "destination-out",
          shadowBlur: 0,
        };

      default:
        return {
          lineCap: "round",
          lineJoin: "round",
          lineWidth: brushSize,
          strokeStyle: color,
          globalCompositeOperation: "source-over",
          shadowBlur: 0,
        };
    }
  };

  const applyBrushSettings = (ctx, settings) => {
    ctx.lineCap = settings.lineCap;
    ctx.lineJoin = settings.lineJoin;
    ctx.lineWidth = settings.lineWidth;
    ctx.strokeStyle = settings.strokeStyle;
    ctx.globalCompositeOperation = settings.globalCompositeOperation;
    ctx.shadowBlur = settings.shadowBlur || 0;
    ctx.shadowColor = settings.shadowColor || "transparent";
  };

  const drawLine = (ctx, from, to, settings) => {
    applyBrushSettings(ctx, settings);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const drawPoint = (ctx, point, settings) => {
    applyBrushSettings(ctx, settings);

    ctx.beginPath();
    ctx.arc(point.x, point.y, settings.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  return {
    hexToRgba,
    getBrushSettings,
    applyBrushSettings,
    drawLine,
    drawPoint,
  };
};
