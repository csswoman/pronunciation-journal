"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

const CROP_SIZE = 250;

interface Props {
  avatarUrl?: string | null;
  initials: string;
  displayName: string;
  email?: string;
  onAvatarUpdate: (file: File) => Promise<void>;
}

export default function ProfileAvatarCard({
  avatarUrl,
  initials,
  displayName,
  email,
  onAvatarUpdate,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDims, setCropDims] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const getCropScale = () => CROP_SIZE / Math.min(cropDims.width, cropDims.height);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      setCropDims({ width: img.naturalWidth, height: img.naturalHeight });
      setCropOffset({ x: -(dw - CROP_SIZE) / 2, y: -(dh - CROP_SIZE) / 2 });
      setCropImageSrc(url);
      setCropImageFile(file);
      setCropModalOpen(true);
    };
    img.src = url;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, offsetX, offsetY } = dragRef.current;
    const scale = getCropScale();
    const dw = cropDims.width * scale;
    const dh = cropDims.height * scale;
    setCropOffset({
      x: Math.min(0, Math.max(-(dw - CROP_SIZE), offsetX + e.clientX - startX)),
      y: Math.min(0, Math.max(-(dh - CROP_SIZE), offsetY + e.clientY - startY)),
    });
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const handleCropConfirm = () => {
    if (!cropImageSrc) return;
    const scale = getCropScale();
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = async () => {
      ctx.drawImage(img, -cropOffset.x / scale, -cropOffset.y / scale, CROP_SIZE / scale, CROP_SIZE / scale, 0, 0, CROP_SIZE, CROP_SIZE);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], cropImageFile?.name ?? "avatar.jpg", { type: "image/jpeg" });
        setCropModalOpen(false);
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc("");
        setCropImageFile(null);
        try {
          setIsUpdating(true);
          await onAvatarUpdate(croppedFile);
        } finally {
          setIsUpdating(false);
        }
      }, "image/jpeg", 0.9);
    };
    img.src = cropImageSrc;
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc("");
    setCropImageFile(null);
  };

  const cropScale = getCropScale();

  return (
    <>
      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Adjust profile photo
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              Drag to position your photo
            </p>
            <div className="flex justify-center mb-6">
              <div
                className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none"
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  outline: "3px solid var(--primary)",
                  outlineOffset: "2px",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {cropImageSrc && (
                  <Image
                    src={cropImageSrc}
                    alt="Preview"
                    width={cropDims.width * cropScale}
                    height={cropDims.height * cropScale}
                    unoptimized
                    draggable={false}
                    style={{
                      position: "absolute",
                      width: cropDims.width * cropScale,
                      height: cropDims.height * cropScale,
                      transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="md" fullWidth onClick={handleCropCancel}>Cancel</Button>
              <Button variant="primary" size="md" fullWidth onClick={handleCropConfirm}>Save photo</Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar display */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full overflow-hidden transition-all focus:outline-none group"
            style={{ background: "var(--bg-tertiary)" }}
            title="Change photo"
            type="button"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {initials}
              </span>
            )}
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </button>
          {isUpdating && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{displayName}</p>
          <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-xs font-medium transition-colors"
            style={{ color: "var(--primary)" }}
            type="button"
          >
            Change photo
          </button>
        </div>
      </div>
    </>
  );
}
