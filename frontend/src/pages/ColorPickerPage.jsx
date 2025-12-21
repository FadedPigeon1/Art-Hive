import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiCopy } from "react-icons/fi";
import { FaPalette } from "react-icons/fa";

const ColorPickerPage = () => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [image, setImage] = useState(null);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setCanvasSize({ width: img.width, height: img.height });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Resize canvas to fit image while maintaining aspect ratio if needed
      // For now, let's just set canvas to image size, but styled to fit container
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

    // Calculate scale in case canvas is displayed smaller than actual size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const color = {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
      hex: rgbToHex(pixel[0], pixel[1], pixel[2]),
    };

    setSelectedColor(color);
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-bg-primary-light dark:bg-bg-primary-dark pt-20 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8 text-center">
          Image Color Picker
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload and Color Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Upload Image
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload image
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {/* Selected Color Section */}
            {selectedColor && (
              <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-6 rounded-xl shadow-lg animate-fade-in">
                <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                  Selected Color
                </h2>

                <div
                  className="w-full h-24 rounded-lg mb-4 shadow-inner border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: selectedColor.hex }}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
                      HEX
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-primary-light dark:text-text-primary-dark">
                        {selectedColor.hex}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedColor.hex)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Copy HEX"
                      >
                        <FiCopy className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-bg-primary-light dark:bg-bg-primary-dark rounded-lg">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
                      RGB
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-primary-light dark:text-text-primary-dark">
                        {`rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
                          )
                        }
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Copy RGB"
                      >
                        <FiCopy className="w-4 h-4 text-text-secondary-light dark:text-text-secondary-dark" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-bg-secondary-light dark:bg-bg-secondary-dark p-4 rounded-xl shadow-lg min-h-[500px] flex items-center justify-center overflow-auto">
              {image ? (
                <div className="relative cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                    style={{ maxHeight: "70vh" }}
                  />
                </div>
              ) : (
                <div className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                  <FaPalette className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">
                    Upload an image to start picking colors
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerPage;
