"use client";

// Planned structure:
// <ProfileAvatarCard>
//   <AvatarImageContainer>
//     <AvatarButton />
//     <AvatarFileInput />
//   </AvatarImageContainer>
//   <AvatarMetaDetails />
//   <AvatarCropModal />
// </ProfileAvatarCard>

import { useRef, useState } from "react";
import Image from "next/image";
import AvatarCropModal from "./AvatarCropModal";

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

  const handleCropConfirm = async (croppedFile: File) => {
    setCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc("");
    }
    setCropImageFile(null);
    try {
      setIsUpdating(true);
      await onAvatarUpdate(croppedFile);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc("");
    }
    setCropImageFile(null);
  };

  return (
    <>
      {cropModalOpen && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          imageFile={cropImageFile}
          dims={cropDims}
          initialOffset={cropOffset}
          onConfirm={(file) => void handleCropConfirm(file)}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex items-center gap-4 py-1">
        <div className="relative shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative size-16 overflow-hidden rounded-full border border-border-subtle bg-surface-sunken shadow-xs transition-all hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95"
            title="Cambiar foto de perfil"
            aria-label="Cambiar foto de perfil"
            type="button"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Foto de perfil" fill className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-label text-h3 font-bold text-fg">
                {initials}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/35">
              <svg
                className="size-5 text-on-primary opacity-0 transition-opacity group-hover:opacity-100"
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
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-xs">
              <div className="size-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
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
          <p className="truncate font-label text-base font-bold text-fg">{displayName}</p>
          <p className="truncate font-caption text-fg-muted">{email}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 font-caption font-semibold text-primary transition-colors hover:text-primary-hover focus:outline-none"
            type="button"
          >
            Cambiar foto
          </button>
        </div>
      </div>
    </>
  );
}
