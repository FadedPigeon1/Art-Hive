import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiCopy, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { FaPalette, FaEyeDropper } from "react-icons/fa";
import { toast } from "react-toastify";

const ColorPickerPage = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [recentColors, setRecentColors] = useState([]);
  const [image, setImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageUpload = (file) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setSelectedColor(null);
          toast.success("Image uploaded successfully!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileChange = (e) => {
    handleImageUpload(e.target.files[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files[0]);
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions to match image
      canvas.width = image.width;
      canvas.height = image.height;

      ctx.drawImage(image, 0, 0);
    }
  }, [image]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Ensure coordinates are within bounds
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      hex: rgbToHex(pixel[0], pixel[1], pixel[2]),
      id: Date.now(), // unique id for key
    };

    setSelectedColor(color);
    addToRecentColors(color);
  };

  const addToRecentColors = (color) => {
    setRecentColors((prev) => {
      // Avoid duplicates at the start of the list
      if (prev.length > 0 && prev[0].hex === color.hex) return prev;
      const newColors = [color, ...prev].slice(0, 10); // Keep last 10
      return newColors;
    });
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${text} to clipboard!`, {
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  const clearImage = () => {
    setImage(null);
    setSelectedColor(null);
    setRecentColors([]);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pt-8 px-4 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-light to-purple-600 bg-clip-text text-transparent mb-3">
            Color Picker
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-lg">
            Extract beautiful colors from your images instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar: Tools & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-xl border border-border-light dark:border-border-dark transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  <FiUpload className="text-primary-light" />
                  Upload Image
                </h2>
                {image && (
                  <button
                    onClick={clearImage}
                    className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Clear Image"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              {!image ? (
                <label
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? "border-primary-light bg-primary-light/10 scale-[1.02]"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-light dark:hover:border-primary-light hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <div className="p-3 bg-primary-light/10 rounded-full mb-3">
                      <FiUpload className="w-6 h-6 text-primary-light" />
                    </div>
                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                      Click or drag image here
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      Supports JPG, PNG, WEBP
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                  />
                </label>
              ) : (
                <div className="relative group rounded-xl overflow-hidden border border-border-light dark:border-border-dark">
                  <img
                    src={image.src}
                    alt="Preview"
                    className="w-full h-48 object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg shadow-lg font-medium hover:scale-105 transition-transform flex items-center gap-2">
                      <FiRefreshCw />
                      Change Image
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={onFileChange}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Color Card */}
            <div
              className={`bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-xl border border-border-light dark:border-border-dark transition-all duration-500 ${
                selectedColor
                  ? "opacity-100 translate-y-0"
                  : "opacity-50 translate-y-4 pointer-events-none"
              }`}
            >
              <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 flex items-center gap-2">
                <FaEyeDropper className="text-primary-light" />
                Selected Color
              </h2>

              {selectedColor ? (
                <>
                  <div
                    className="w-full h-32 rounded-xl mb-6 shadow-inner border border-border-light dark:border-border-dark relative group overflow-hidden"
                    style={{ backgroundColor: selectedColor.hex }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                      <span className="text-white font-mono font-bold text-lg drop-shadow-md">
                        {selectedColor.hex}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ColorValueRow
                      label="HEX"
                      value={selectedColor.hex}
                      onCopy={() => copyToClipboard(selectedColor.hex)}
                    />
                    <ColorValueRow
                      label="RGB"
                      value={`rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`}
                      onCopy={() =>
                        copyToClipboard(
                          `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
                        )
                      }
                    />
                    <ColorValueRow
                      label="CSS"
                      value={`rgb(${selectedColor.r} ${selectedColor.g} ${selectedColor.b})`}
                      onCopy={() =>
                        copyToClipboard(
                          `rgb(${selectedColor.r} ${selectedColor.g} ${selectedColor.b})`
                        )
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-text-secondary-light dark:text-text-secondary-dark border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
                  <FaPalette className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Click image to pick a color</p>
                </div>
              )}
            </div>

            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-xl border border-border-light dark:border-border-dark animate-fade-in">
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                  Recent Colors
                </h2>
                <div className="flex flex-wrap gap-3">
                  {recentColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColor(color);
                        copyToClipboard(color.hex);
                      }}
                      className="w-10 h-10 rounded-full shadow-md border-2 border-white dark:border-gray-700 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-light"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Canvas Area */}
          <div className="lg:col-span-8">
            <div
              ref={containerRef}
              className="bg-surface-light dark:bg-surface-dark p-1 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark h-[600px] flex items-center justify-center overflow-hidden relative bg-checkered"
            >
              {image ? (
                <div className="relative w-full h-full overflow-auto flex items-center justify-center custom-scrollbar">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair max-w-none shadow-lg"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-text-secondary-light dark:text-text-secondary-dark p-8">
                  <div className="w-24 h-24 bg-surface-light dark:bg-surface-dark rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FaPalette className="w-10 h-10 text-primary-light opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                    No Image Selected
                  </h3>
                  <p className="max-w-md mx-auto">
                    Upload an image from the sidebar to start exploring its
                    color palette.
                  </p>
                </div>
              )}
            </div>

            {image && (
              <div className="mt-4 flex justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark px-2">
                <span>
                  Original size: {image.width} x {image.height}px
                </span>
                <span>Click anywhere to sample color</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #808080 25%, transparent 25%),
            linear-gradient(-45deg, #808080 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #808080 75%),
            linear-gradient(-45deg, transparent 75%, #808080 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #f0f0f0;
        }
        .dark .bg-checkered {
          background-color: #1a1a1a;
          background-image: linear-gradient(45deg, #333 25%, transparent 25%),
            linear-gradient(-45deg, #333 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #333 75%),
            linear-gradient(-45deg, transparent 75%, #333 75%);
        }
      `}</style>
    </div>
  );
};

const ColorValueRow = ({ label, value, onCopy }) => (
  <div className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
    <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium text-sm">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <span className="font-mono text-text-primary-light dark:text-text-primary-dark text-sm select-all">
        {value}
      </span>
      <button
        onClick={onCopy}
        className="p-1.5 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-light dark:hover:text-primary-light hover:bg-primary-light/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
        title="Copy"
      >
        <FiCopy className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default ColorPickerPage;
