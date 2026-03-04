"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

type Props = {
  currentUrl?: string | null;
  onUrlChange: (url: string) => void;
  onEmojiChange?: (emoji: string) => void;
};

export default function ImageUpload({ currentUrl, onUrlChange, onEmojiChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl ?? "");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok) {
      setPreview(data.url);
      onUrlChange(data.url);
    } else {
      setError(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {preview ? (
        <div className="relative inline-block">
          <div className="relative h-36 w-36 overflow-hidden rounded-xl border border-border bg-muted-light">
            <Image src={preview} alt="Product" fill className="object-contain p-2" />
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-2 text-[10px] font-bold text-primary uppercase tracking-wider">Updating...</p>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => { setPreview(""); onUrlChange(""); }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted-light py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary-light/10 disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <p className="mt-2 text-sm font-bold text-primary">Uploading your image...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted" />
              <span className="text-sm font-medium text-foreground">
                Click to upload image
              </span>
              <span className="text-xs text-muted">or drag & drop · JPG, PNG, WebP · max 5 MB</span>
            </>
          )}
        </button>
      )}

      {/* Also allow pasting a URL directly */}
      <input
        type="url"
        placeholder="Or paste an image URL…"
        value={preview}
        onChange={(e) => { setPreview(e.target.value); onUrlChange(e.target.value); }}
        className="w-full rounded-xl border border-border px-4 py-2 text-sm outline-none focus:border-primary"
      />

      {/* Generic emoji quick-picks */}
      {onEmojiChange && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Quick-set emoji (used when no image):</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Pill", emoji: "💊" },
              { label: "Tablet", emoji: "⚪" },
              { label: "Capsule", emoji: "💊" },
              { label: "Syrup", emoji: "🧪" },
              { label: "Cream", emoji: "🧴" },
              { label: "Ointment", emoji: "🧪" },
              { label: "Device", emoji: "🩺" },
              { label: "Vitamin", emoji: "☀️" },
              { label: "Herbal", emoji: "🌿" },
              { label: "Injection", emoji: "💉" },
              { label: "Bandage", emoji: "🩹" },
              { label: "Drops", emoji: "💧" },
              { label: "Spray", emoji: "💨" },
              { label: "Mask", emoji: "😷" },
              { label: "Gloves", emoji: "🧤" },
              { label: "First Aid", emoji: "🚑" },
              { label: "Thermometer", emoji: "🌡️" },
              { label: "Sanitizer", emoji: "🧼" },
              { label: "Heart", emoji: "❤️" },
              { label: "Baby", emoji: "👶" },
              { label: "Woman", emoji: "👩" },
              { label: "Elderly", emoji: "👴" },
            ].map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => {
                  onEmojiChange(g.emoji);
                  setPreview("");
                  onUrlChange("");
                }}
                className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary-light/20"
                title={`Set emoji to ${g.emoji} ${g.label}`}
              >
                {g.emoji} <span className="text-xs text-muted">{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
