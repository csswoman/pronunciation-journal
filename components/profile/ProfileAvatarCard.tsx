"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { H3 } from "@/components/ui/Typography";

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
  const cropBoxRef = useRef<HTMLDivElement>(null);
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

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const scale = getCropScale();
    const dw = cropDims.width * scale;
    const dh = cropDims.height * scale;
    const step = e.shiftKey ? 24 : 8;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCropOffset((prev) => ({ ...prev, x: Math.min(0, Math.max(-(dw - CROP_SIZE), prev.x + step)) }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCropOffset((prev) => ({ ...prev, x: Math.min(0, Math.max(-(dw - CROP_SIZE), prev.x - step)) }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCropOffset((prev) => ({ ...prev, y: Math.min(0, Math.max(-(dh - CROP_SIZE), prev.y + step)) }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCropOffset((prev) => ({ ...prev, y: Math.min(0, Math.max(-(dh - CROP_SIZE), prev.y - step)) }));
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCropCancel();
    }
  };

  useEffect(() => {
    if (cropModalOpen) {
      cropBoxRef.current?.focus();
    }
  }, [cropModalOpen]);

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
      {/* Modal de recorte */}
      {cropModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-2xl">
            <H3 id="crop-modal-title" className="mb-1 text-base font-semibold text-fg">
              Ajustar foto de perfil
            </H3>
            <p className="mb-4 text-body-sm text-fg-muted">
              Arrastra o usa las teclas de flecha para encuadrar tu foto
            </p>
            <div className="mb-5 flex justify-center">
              <div
                ref={cropBoxRef}
                tabIndex={0}
                role="region"
                aria-label="Área de encuadre. Usa las flechas del teclado para mover la imagen."
                className="relative h-[250px] w-[250px] cursor-grab select-none overflow-hidden rounded-full outline outline-[3px] outline-primary outline-offset-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleKeyDown}
              >
                {cropImageSrc && (
                  <Image
                    src={cropImageSrc}
                    alt="Vista previa del recorte"
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
              <Button variant="outline" size="md" fullWidth onClick={handleCropCancel}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={handleCropConfirm}>
                Guardar foto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar display */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-16 w-16 overflow-hidden rounded-full bg-surface-sunken transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            title="Cambiar foto de perfil"
            aria-label="Cambiar foto de perfil"
            type="button"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Foto de perfil" fill className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-h4 font-bold text-fg">
                {initials}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/30">
              <svg
                className="h-5 w-5 text-on-primary opacity-0 transition-opacity group-hover:opacity-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
          </button>
          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--on-primary)] border-t-transparent" />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Cargar nueva imagen de perfil"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">{displayName}</p>
          <p className="truncate text-body-sm text-fg-muted">{email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-caption font-medium text-primary transition-colors hover:text-primary-hover"
            type="button"
          >
            Cambiar foto
          </button>
        </div>
      </div>
    </>
  );
}
