"use client";

// Planned structure:
// <ProfileIdentityCard>
//   <IdentityTopHeader>
//     <AvatarWithCameraBadge />
//     <UserMetaDetails />
//     <EditProfileButton />
//   </IdentityTopHeader>
//   <IdentityDetailsList>
//     <DisplayNameRow />
//   </IdentityDetailsList>
//   <AvatarCropModal />
// </ProfileIdentityCard>

import { useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import AvatarCropModal from "./AvatarCropModal";

const CROP_SIZE = 250;

interface Props {
  avatarUrl?: string | null;
  initials: string;
  displayName: string;
  email?: string;
  onAvatarUpdate: (file: File) => Promise<void>;
  onNameSave: (name: string) => Promise<void>;
}

export default function ProfileIdentityCard({
  avatarUrl,
  initials,
  displayName,
  email,
  onAvatarUpdate,
  onNameSave,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDims, setCropDims] = useState({ width: 0, height: 0 });

  // Row inline edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

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
      setIsUpdatingAvatar(true);
      await onAvatarUpdate(croppedFile);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setNameError("El nombre no puede estar vacío");
      return;
    }
    try {
      setNameError("");
      setIsSavingName(true);
      await onNameSave(nameInput.trim());
      setIsEditingName(false);
    } catch {
      setNameError("Error al actualizar nombre");
    } finally {
      setIsSavingName(false);
    }
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
          onCancel={() => {
            setCropModalOpen(false);
            if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc("");
            setCropImageFile(null);
          }}
        />
      )}

      <div className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative size-16 overflow-hidden rounded-full border border-border-subtle bg-surface-sunken shadow-xs transition-all hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              </button>
              {/* Pink Camera Badge Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-surface-raised bg-primary text-on-primary shadow-xs transition-transform hover:scale-110 active:scale-95"
                title="Cambiar foto"
                aria-label="Cambiar foto"
                type="button"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {isUpdatingAvatar && (
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

            <div className="min-w-0">
              <h1 className="truncate font-display text-h3 font-bold text-fg">{displayName}</h1>
              <p className="truncate font-caption text-fg-muted">{email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingName((prev) => !prev)}
            className="rounded-full border border-border-default px-4 py-1.5 font-label text-body-sm font-semibold text-fg transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-primary"
            type="button"
          >
            Editar perfil
          </button>
        </div>

        {/* Row 1: Nombre para mostrar */}
        <div className="border-t border-border-subtle pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-caption text-fg-muted">Nombre para mostrar</span>
            <span className="font-label text-body-sm font-semibold text-fg">{displayName}</span>
            <button
              onClick={() => {
                setNameInput(displayName);
                setIsEditingName((prev) => !prev);
              }}
              className="rounded-full border border-border-default px-3.5 py-1 font-label text-caption font-semibold text-fg transition-colors hover:bg-surface-sunken"
              type="button"
            >
              Cambiar
            </button>
          </div>
          {isEditingName && (
            <form onSubmit={handleNameSubmit} className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full rounded-md border border-border-default bg-surface-sunken px-3.5 py-2 text-body-sm text-fg transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
              {nameError && <p className="font-caption text-error">{nameError}</p>}
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={isSavingName}>
                  {isSavingName ? "Guardando…" : "Guardar"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingName(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
