"use client";

// Planned structure:
// <AvatarCropModal>
//   <DialogOverlay />
//   <CropContainer>
//     <CropViewport />
//     <CropImage />
//   </CropContainer>
//   <CropActions />
// </AvatarCropModal>

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { H3 } from "@/components/ui/Typography";

const CROP_SIZE = 250;

interface Props {
  imageSrc: string;
  imageFile: File | null;
  dims: { width: number; height: number };
  initialOffset: { x: number; y: number };
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({
  imageSrc,
  imageFile,
  dims,
  initialOffset,
  onConfirm,
  onCancel,
}: Props) {
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const [cropOffset, setCropOffset] = useState(initialOffset);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const getCropScale = () => CROP_SIZE / Math.min(dims.width, dims.height);

  useEffect(() => {
    cropBoxRef.current?.focus();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, offsetX: cropOffset.x, offsetY: cropOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { startX, startY, offsetX, offsetY } = dragRef.current;
    const scale = getCropScale();
    const dw = dims.width * scale;
    const dh = dims.height * scale;
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
    const dw = dims.width * scale;
    const dh = dims.height * scale;
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
      onCancel();
    }
  };

  const handleConfirmClick = () => {
    if (!imageSrc) return;
    const scale = getCropScale();
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, -cropOffset.x / scale, -cropOffset.y / scale, CROP_SIZE / scale, CROP_SIZE / scale, 0, 0, CROP_SIZE, CROP_SIZE);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], imageFile?.name ?? "avatar.jpg", { type: "image/jpeg" });
        onConfirm(croppedFile);
      }, "image/jpeg", 0.9);
    };
    img.src = imageSrc;
  };

  const cropScale = getCropScale();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-2xl">
        <H3 id="crop-modal-title" className="mb-1 font-label text-base text-fg">
          Ajustar foto de perfil
        </H3>
        <p className="mb-5 font-caption text-fg-muted">
          Arrastra la imagen o usa las flechas del teclado para encuadrarla.
        </p>
        <div className="mb-6 flex justify-center">
          <div
            ref={cropBoxRef}
            tabIndex={0}
            role="region"
            aria-label="Área de encuadre. Usa las flechas del teclado para mover la imagen."
            className="relative h-[250px] w-[250px] cursor-grab select-none overflow-hidden rounded-full border-2 border-primary/40 ring-4 ring-primary/20 transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/40 active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            {imageSrc && (
              <Image
                src={imageSrc}
                alt="Vista previa del recorte"
                width={dims.width * cropScale}
                height={dims.height * cropScale}
                unoptimized
                draggable={false}
                style={{
                  position: "absolute",
                  width: dims.width * cropScale,
                  height: dims.height * cropScale,
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={handleConfirmClick}>
            Guardar foto
          </Button>
        </div>
      </div>
    </div>
  );
}
