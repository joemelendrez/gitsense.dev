import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  X, 
  FileImage,
  Zap,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle,
  ImageIcon
} from 'lucide-react';

interface ConvertedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  webpUrl: string;
  originalSize: number;
  webpSize: number;
  compressionRatio: number;
  quality: number;
}

const ImageConverter = () => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [quality, setQuality] = useState(80);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert image to WebP
  const convertToWebP = useCallback((file: File, quality: number): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                resolve({ blob, url });
              } else {
                reject(new Error('Failed to create WebP blob'));
              }
            },
            'image/webp',
            quality / 100
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file processing
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type === 'image/png' || 
      file.type === 'image/jpeg' || 
      file.type === 'image/jpg'
    );

    if (validFiles.length === 0) {
      alert('Please select PNG or JPG images only.');
      return;
    }

    setIsConverting(true);

    try {
      const convertedImages = await Promise.all(
        validFiles.map(async (file) => {
          const originalUrl = URL.createObjectURL(file);
          const { blob, url: webpUrl } = await convertToWebP(file, quality);
          
          const compressionRatio = Math.round(((file.size - blob.size) / file.size) * 100);
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            originalUrl,
            webpUrl,
            originalSize: file.size,
            webpSize: blob.size,
            compressionRatio,
            quality
          };
        })
      );

      setImages(prev => [...prev, ...convertedImages]);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting images. Please try again.');
    } finally {
      setIsConverting(false);
    }
  }, [convertToWebP, quality]);

  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Download single image
  const downloadImage = (image: ConvertedImage) => {
    const link = document.createElement('a');
    link.href = image.webpUrl;
    link.download = `${image.originalFile.name.split('.')[0]}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all images as zip (simplified version)
  const downloadAll = () => {
    images.forEach((image, index) => {
      setTimeout(() => {
        downloadImage(image);
      }, index * 100); // Small delay to prevent browser blocking
    });
  };

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      return updated;
    });
  };

  // Clear all images
  const clearAll = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.webpUrl);
    });
    setImages([]);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate total savings
  const totalSavings = images.reduce((acc, img) => acc + (img.originalSize - img.webpSize), 0);
  const totalOriginalSize = images.reduce((acc, img) => acc + img.originalSize, 0);
  const overallCompression = totalOriginalSize > 0 ? Math.round((totalSavings / totalOriginalSize) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg">
            <FileImage className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Image to WebP Converter
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
            {' '}for Developers
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Convert PNG and JPG images to WebP format for better web performance. 
          Reduce file sizes by up to 80% while maintaining quality.
        </p>
      </div>

      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Conversion Settings
          </h3>
          {images.length > 0 && (
            <div className="text-sm text-gray-600">
              {images.length} image{images.length !== 1 ? 's' : ''} • {overallCompression}% compression
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Quality:</label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[3ch]">{quality}%</span>
          </div>
          
          <div className="text-xs text-gray-500">
            Higher quality = larger file size
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gray-100 rounded-full">
              <Upload className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop images here or click to upload
            </h3>
            <p className="text-gray-600 text-sm">
              Supports PNG and JPG files • Multiple files supported
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isConverting}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            {isConverting ? 'Converting...' : 'Select Images'}
          </button>
        </div>
      </div>

      {/* Results */}
      {images.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Converted Images ({images.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={downloadAll}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </button>
              <button
                onClick={clearAll}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {images.length > 1 && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatFileSize(totalSavings)}
                  </div>
                  <div className="text-sm text-green-600">Total Saved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {overallCompression}%
                  </div>
                  <div className="text-sm text-green-600">Compression</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {images.length}
                  </div>
                  <div className="text-sm text-green-600">Images Converted</div>
                </div>
              </div>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Image Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={image.webpUrl}
                    alt="Converted preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 truncate">
                      {image.originalFile.name}
                    </h4>
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        -{image.compressionRatio}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Original:</span>
                      <span>{formatFileSize(image.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>WebP:</span>
                      <span>{formatFileSize(image.webpSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span>{image.quality}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadImage(image)}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download WebP
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          About WebP Format
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
          <div>
            <h5 className="font-semibold mb-2">Benefits:</h5>
            <ul className="space-y-1">
              <li>• 25-80% smaller file sizes</li>
              <li>• Better compression than PNG/JPG</li>
              <li>• Supports transparency and animation</li>
              <li>• Faster website loading times</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Browser Support:</h5>
            <ul className="space-y-1">
              <li>• Chrome/Edge: Full support</li>
              <li>• Firefox: Full support</li>
              <li>• Safari: iOS 14+, macOS Big Sur+</li>
              <li>• 95%+ global browser support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageConverter;