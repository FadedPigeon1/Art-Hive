import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";

export const useTimelapse = (canvasWidth, canvasHeight) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const recordingEvents = useRef([]);
  const startTime = useRef(0);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    recordingEvents.current = [];
    startTime.current = Date.now();
    toast.info("Started time-lapse recording");
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    toast.info("Stopped time-lapse recording. Preparing to export...");
    exportTimelapse();
  }, []);

  const recordEvent = useCallback(
    (event) => {
      if (!isRecording) return;

      recordingEvents.current.push({
        ...event,
        timestamp: Date.now() - startTime.current,
      });
    },
    [isRecording],
  );

  const exportTimelapse = useCallback(async () => {
    if (recordingEvents.current.length === 0) {
      toast.warning("No drawing activity recorded.");
      return;
    }

    setIsExporting(true);
    toast.info("Exporting time-lapse...");

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    try {
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `art-hive-timelapse-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.success("Time-lapse downloaded successfully!");
      };

      mediaRecorder.start();

      for (const ev of recordingEvents.current) {
        if (ev.type === "stroke") {
          ctx.save();
          ctx.strokeStyle =
            ev.stroke.settings?.strokeStyle || ev.stroke.brushColor;
          ctx.lineWidth = ev.stroke.settings?.lineWidth || ev.stroke.brushSize;
          ctx.lineCap = ev.stroke.settings?.lineCap || "round";
          ctx.lineJoin = "round";
          ctx.shadowBlur = ev.stroke.settings?.shadowBlur || 0;
          ctx.shadowColor = ev.stroke.brushColor;

          if (
            ev.stroke.brushType === "AIRBRUSH" ||
            ev.stroke.brushType === "CHARCOAL"
          ) {
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(
              ev.stroke.x,
              ev.stroke.y,
              ev.stroke.brushSize / 2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          } else if (ev.stroke.brushType === "MARKER") {
            ctx.globalCompositeOperation = "multiply";
            ctx.beginPath();
            ctx.moveTo(ev.stroke.lastX, ev.stroke.lastY);
            ctx.lineTo(ev.stroke.x, ev.stroke.y);
            ctx.stroke();
          } else {
            ctx.beginPath();
            if (ev.stroke.lastX !== undefined) {
              ctx.moveTo(ev.stroke.lastX, ev.stroke.lastY);
              ctx.lineTo(ev.stroke.x, ev.stroke.y);
            } else {
              ctx.moveTo(ev.stroke.x, ev.stroke.y);
              ctx.lineTo(ev.stroke.x, ev.stroke.y);
            }
            ctx.stroke();
          }
          ctx.restore();

          // Also handle symmetry points if they exist in the event
          if (
            ev.stroke.symmetryConfig &&
            ev.stroke.symmetryConfig.mode !== "none"
          ) {
            const type = ev.stroke.symmetryConfig.mode;
            const axisX = ev.stroke.symmetryConfig.axisX;
            const axisY = ev.stroke.symmetryConfig.axisY;

            const mirrorPoint = (pt) => {
              if (!pt) return null;
              if (type === "vertical")
                return { x: axisX + (axisX - pt.x), y: pt.y };
              if (type === "horizontal")
                return { x: pt.x, y: axisY + (axisY - pt.y) };
              if (type === "radial")
                return { x: axisX + (axisX - pt.x), y: axisY + (axisY - pt.y) };
              return pt;
            };

            const symPts = [
              {
                c: mirrorPoint({ x: ev.stroke.x, y: ev.stroke.y }),
                l: mirrorPoint({ x: ev.stroke.lastX, y: ev.stroke.lastY }),
              },
            ];

            if (type === "radial") {
              const mVert = (pt) => ({ x: axisX + (axisX - pt.x), y: pt.y });
              const mHorz = (pt) => ({ x: pt.x, y: axisY + (axisY - pt.y) });
              symPts.push({
                c: mVert({ x: ev.stroke.x, y: ev.stroke.y }),
                l: mVert({ x: ev.stroke.lastX, y: ev.stroke.lastY }),
              });
              symPts.push({
                c: mHorz({ x: ev.stroke.x, y: ev.stroke.y }),
                l: mHorz({ x: ev.stroke.lastX, y: ev.stroke.lastY }),
              });
            }

            symPts.forEach((pt) => {
              if (!pt.c || !pt.l) return;
              ctx.save();
              ctx.strokeStyle =
                ev.stroke.settings?.strokeStyle || ev.stroke.brushColor;
              ctx.lineWidth =
                ev.stroke.settings?.lineWidth || ev.stroke.brushSize;
              ctx.lineCap = ev.stroke.settings?.lineCap || "round";
              ctx.beginPath();
              ctx.moveTo(pt.l.x, pt.l.y);
              ctx.lineTo(pt.c.x, pt.c.y);
              ctx.stroke();
              ctx.restore();
            });
          }
        } else if (ev.type === "layer_add_text") {
          ctx.save();
          ctx.font = `${ev.fontSize}px ${ev.font || "sans-serif"}`;
          ctx.fillStyle = ev.color;
          ctx.fillText(ev.content, ev.x, ev.y);
          ctx.restore();
        }

        await new Promise((resolve) => setTimeout(resolve, 8)); // fast replay
      }

      setTimeout(() => {
        mediaRecorder.stop();
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(
        "Failed to export time-lapse. Your browser may not support WebM recording.",
      );
      setIsExporting(false);
    }
  }, [canvasWidth, canvasHeight]);

  return {
    isRecording,
    isExporting,
    startRecording,
    stopRecording,
    recordEvent,
  };
};
