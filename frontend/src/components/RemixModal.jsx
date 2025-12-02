import React, { useState, useRef, useEffect } from "react";
import { FiX, FiDownload, FiUpload } from "react-icons/fi";
import { postsAPI } from "../utils/api";
import { toast } from "react-toastify";

const RemixModal = ({ post, onClose, onRemixCreated }) => {
  const canvasRef = useRef(null);
  const [title, setTitle] = useState(
    post.title ? `Remix of ${post.title}` : "My Remix"
  );
  const [caption, setCaption] = useState(
    `Remix of @${post.userId?.username}'s artwork`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };

    img.onerror = () => {
      toast.error("Failed to load image. Using blank canvas.");
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    img.src = post.imageUrl;
  }, [post.imageUrl]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.src = post.imageUrl;
  };

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      const imageUrl = canvas.toDataURL("image/png");
      const blob = dataURLtoBlob(imageUrl);
      const file = new File([blob], "remix.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("title", title);
      formData.append("caption", caption);
      formData.append("remixedFrom", post._id);
      formData.append("image", file);

      // Create the remix post
      await postsAPI.createPost(formData);

      toast.success("Remix posted successfully!");
      if (onRemixCreated) onRemixCreated();
      onClose();
    } catch (error) {
      console.error("Error creating remix:", error);
      toast.error(error.response?.data?.message || "Failed to create remix");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Remix Artwork
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light dark:hover:bg-surface-dark rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Original Creator Credit */}
          <div className="mb-4 p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Original artwork by{" "}
              <span className="font-semibold text-primary-light dark:text-primary-dark">
                @{post.userId?.username}
              </span>
            </p>
          </div>

          {/* Drawing Tools */}
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-primary-light dark:text-text-primary-dark">
                Brush Size:
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {brushSize}px
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-text-primary-light dark:text-text-primary-dark">
                Color:
              </label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
              />
            </div>

            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg hover:opacity-80 transition-opacity"
            >
              Reset Canvas
            </button>
          </div>

          {/* Canvas */}
          <div className="mb-4 border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="max-w-full h-auto cursor-crosshair bg-white"
              style={{ display: "block", margin: "0 auto" }}
            />
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your remix a title"
              className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
              maxLength={100}
            />
          </div>

          {/* Caption */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your remix..."
              className="w-full p-3 border border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
              rows="3"
              maxLength={500}
            />
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {caption.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-border-light dark:border-border-dark rounded-lg text-text-primary-light dark:text-text-primary-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Posting..." : "Post Remix"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemixModal;
