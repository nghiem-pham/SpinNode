import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageType: 'avatar' | 'cover';
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageEditorModal({ isOpen, imageUrl, imageType, onSave, onCancel }: ImageEditorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  if (!isOpen) return null;

  const handleSave = () => {
    // In a real implementation, you would apply the edits and export the edited image
    // For now, we'll just pass the original image URL
    onSave(imageUrl);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const imageStyle = {
    transform: `scale(${zoom}) rotate(${rotation}deg)`,
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transition: 'all 0.3s ease',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit {imageType === 'avatar' ? 'Profile Photo' : 'Cover Photo'}</h2>
            <p className="text-sm text-gray-300">Adjust your photo before saving</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Preview */}
            <div className="lg:col-span-2">
              <div className="bg-gray-100 rounded-lg overflow-hidden relative" style={{ minHeight: '400px' }}>
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className={`max-w-full max-h-full object-contain ${
                        imageType === 'avatar' ? 'rounded-full' : 'rounded-lg'
                      }`}
                      style={imageStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Zoom Controls */}
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Maximize2 className="size-4" />
                  Zoom
                </Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#009999]"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <ZoomOut className="size-4" />
                    </button>
                    <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <ZoomIn className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RotateCw className="size-4" />
                  Rotation
                </Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#009999]"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setRotation((rotation - 90 + 360) % 360)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <RotateCw className="size-4 transform -scale-x-100" />
                    </button>
                    <span className="text-sm text-gray-600">{rotation}°</span>
                    <button
                      onClick={() => setRotation((rotation + 90) % 360)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <RotateCw className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Brightness */}
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-3">Brightness</Label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#009999]"
                />
                <span className="text-sm text-gray-600 block text-center mt-1">{brightness}%</span>
              </div>

              {/* Contrast */}
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-3">Contrast</Label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="1"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#009999]"
                />
                <span className="text-sm text-gray-600 block text-center mt-1">{contrast}%</span>
              </div>

              {/* Saturation */}
              <div>
                <Label className="text-sm font-semibold text-gray-900 mb-3">Saturation</Label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#009999]"
                />
                <span className="text-sm text-gray-600 block text-center mt-1">{saturation}%</span>
              </div>

              {/* Reset Button */}
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#009999] hover:bg-[#008080]"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
