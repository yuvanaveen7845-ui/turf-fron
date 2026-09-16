import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Plus,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import api from "../../services/api";

interface TurfImageManagerProps {
  images: string[];
  onChange: (newImages: string[]) => void;
}

const PRESET_ATHLETIC_PHOTOS = [
  {
    name: "Tournament Football Arena (Floodlit)",
    url: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
    tag: "Football",
  },
  {
    name: "FIFA Monofilament Pitch (Daylight)",
    url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
    tag: "Football",
  },
  {
    name: "Box Cricket & Futsal Enclosure",
    url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
    tag: "Cricket",
  },
  {
    name: "Cricket Bowling Nets & Pitch",
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    tag: "Cricket",
  },
  {
    name: "All-Weather Multi-Sport Dome",
    url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
    tag: "Multi-Sport",
  },
  {
    name: "Indoor Badminton & Futsal Arena",
    url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80",
    tag: "Indoor",
  },
];

export const TurfImageManager: React.FC<TurfImageManagerProps> = ({
  images,
  onChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file uploads
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post("/turfs/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.urls) {
        onChange([...images, ...response.data.urls]);
      } else if (response.data && response.data.url) {
        onChange([...images, response.data.url]);
      }
    } catch (err) {
      console.warn("Server multipart upload failed, converting to high-res data URL fallback:", err);
      // Fallback to FileReader base64 Data URLs so it always works client-side
      const newUrls: string[] = [];
      const filePromises = Array.from(files).map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              newUrls.push(e.target.result as string);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });

      await Promise.all(filePromises);
      onChange([...images, ...newUrls]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = () => {
    if (!urlInputValue.trim()) return;
    onChange([...images, urlInputValue.trim()]);
    setUrlInputValue("");
    setShowUrlInput(false);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const filtered = images.filter((_, i) => i !== index);
    onChange([item, ...filtered]);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const newArr = [...images];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    onChange(newArr);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleAddPreset = (url: string) => {
    if (images.includes(url)) return;
    onChange([...images, url]);
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-800">
            Pitch Gallery & Media ({images.length} photos)
          </label>
          <span className="text-[11px] text-slate-500">
            Upload custom high-res photos from your device, drag & drop, or add image URLs.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <LinkIcon className="w-3 h-3 text-slate-500" />
            <span>{showUrlInput ? "Hide URL" : "+ Add by URL"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#059669] text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Preset Gallery</span>
          </button>
        </div>
      </div>

      {/* URL Input Row */}
      {showUrlInput && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2">
          <input
            type="url"
            placeholder="Paste image link (e.g. https://...)"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#059669] focus:outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 bg-[#059669] text-white rounded-lg text-xs font-bold hover:bg-[#047857] cursor-pointer"
          >
            Add Image
          </button>
        </div>
      )}

      {/* Athletic Presets Drawer */}
      {showPresets && (
        <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-[#059669] tracking-wider">
              Quick Athletic Turf Presets
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_ATHLETIC_PHOTOS.map((preset, idx) => {
              const isAdded = images.includes(preset.url);
              return (
                <div
                  key={idx}
                  onClick={() => !isAdded && handleAddPreset(preset.url)}
                  className={`relative group rounded-xl overflow-hidden border cursor-pointer transition-all ${
                    isAdded
                      ? "border-emerald-500 opacity-60 pointer-events-none"
                      : "border-slate-200 hover:border-emerald-500 hover:shadow-sm"
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-16 object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 p-1.5 flex flex-col justify-between text-white">
                    <span className="text-[9px] font-bold bg-black/60 px-1 py-0.5 rounded self-start">
                      {preset.tag}
                    </span>
                    <span className="text-[10px] font-bold leading-tight line-clamp-1">
                      {isAdded ? "✓ Added" : preset.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
          isDragging
            ? "border-[#059669] bg-[#ECFDF5]/50 scale-[1.01]"
            : "border-slate-200 hover:border-[#059669] hover:bg-slate-50/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shadow-xs">
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-slate-800">
            {isUploading
              ? "Uploading & processing image files..."
              : "Drop image files here, or click to browse from device"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supports JPEG, PNG, WebP (Multi-select enabled, up to 10MB per file)
          </p>
        </div>
      </div>

      {/* Gallery Strip with Controls */}
      {images.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block">
            Current Images ({images.length}) — First photo is the main cover
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgUrl, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={idx}
                  className={`group relative rounded-2xl overflow-hidden border bg-white shadow-xs transition-all ${
                    isCover
                      ? "ring-2 ring-[#059669] border-emerald-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Turf image ${idx + 1}`}
                    className="w-full h-24 object-cover"
                  />

                  {/* Cover badge */}
                  {isCover ? (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#059669] text-white text-[10px] font-extrabold flex items-center space-x-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Main Cover</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetCover(idx);
                      }}
                      className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-md bg-black/70 hover:bg-[#059669] text-white text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Action overlay buttons */}
                  <div className="absolute bottom-1.5 right-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, "left");
                        }}
                        title="Move left"
                        className="p-1 text-white hover:text-emerald-400 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    )}

                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(idx, "right");
                        }}
                        title="Move right"
                        className="p-1 text-white hover:text-emerald-400 cursor-pointer"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(imgUrl);
                      }}
                      title="Preview"
                      className="p-1 text-white hover:text-blue-400 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(idx);
                      }}
                      title="Delete"
                      className="p-1 text-white hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2 space-y-2 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-2 pt-1 text-white">
              <span className="text-xs font-bold">Image High-Res Preview</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full max-h-[70vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
