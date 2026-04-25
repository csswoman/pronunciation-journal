"use client";
import Button from "@/components/ui/Button";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/auth/AuthProvider";

const CROP_SIZE = 250;

export default function ProfileSettings() {
  const { user } = useAuth();
  const { preferences, loading, updateFullName, updateAvatar, updatePassword } =
    useUserPreferences();

  const displayName =
    preferences?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "U";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const [fullName, setFullName] = useState(preferences?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropImageDimensions, setCropImageDimensions] = useState({ width: 0, height: 0 });
  const cropDragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    if (preferences?.full_name) setFullName(preferences.full_name);
  }, [preferences?.full_name]);

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message);
      setSuccessMessage("");
    } else {
      setSuccessMessage(message);
      setErrorMessage("");
    }
    setTimeout(() => {
      setErrorMessage("");
      setSuccessMessage("");
    }, 3000);
  };

  // Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      setCropImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setCropOffset({ x: -(dw - CROP_SIZE) / 2, y: -(dh - CROP_SIZE) / 2 });
      setCropImageSrc(url);
      setCropImageFile(file);
      setCropModalOpen(true);
    };
    img.src = url;
  };

  const getCropScale = () =>
    CROP_SIZE / Math.min(cropImageDimensions.width, cropImageDimensions.height);

  const handleCropPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    cropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: cropOffset.x,
      offsetY: cropOffset.y,
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!cropDragRef.current) return;
    const { startX, startY, offsetX, offsetY } = cropDragRef.current;
    const scale = getCropScale();
    const dw = cropImageDimensions.width * scale;
    const dh = cropImageDimensions.height * scale;
    const newX = Math.min(0, Math.max(-(dw - CROP_SIZE), offsetX + e.clientX - startX));
    const newY = Math.min(0, Math.max(-(dh - CROP_SIZE), offsetY + e.clientY - startY));
    setCropOffset({ x: newX, y: newY });
  };

  const handleCropPointerUp = () => {
    cropDragRef.current = null;
  };

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
      ctx.drawImage(
        img,
        -cropOffset.x / scale,
        -cropOffset.y / scale,
        CROP_SIZE / scale,
        CROP_SIZE / scale,
        0, 0, CROP_SIZE, CROP_SIZE
      );
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], cropImageFile?.name ?? "avatar.jpg", { type: "image/jpeg" });
        setCropModalOpen(false);
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc("");
        setCropImageFile(null);
        try {
          setIsUpdatingAvatar(true);
          await updateAvatar(croppedFile);
          showMessage("Foto actualizada");
        } catch (err) {
          showMessage(err instanceof Error ? err.message : "Error al actualizar la foto", true);
        } finally {
          setIsUpdatingAvatar(false);
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

  // Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showMessage("El nombre no puede estar vacío", true);
      return;
    }
    try {
      setIsSavingName(true);
      await updateFullName(fullName);
      setIsEditingName(false);
      showMessage("Nombre actualizado");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Error al actualizar el nombre", true);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelName = () => {
    setFullName(preferences?.full_name || "");
    setIsEditingName(false);
  };

  // Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showMessage("La contraseña no puede estar vacía", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("Las contraseñas no coinciden", true);
      return;
    }
    if (newPassword.length < 6) {
      showMessage("Mínimo 6 caracteres", true);
      return;
    }
    try {
      setIsSavingPassword(true);
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
      showMessage("Contraseña actualizada");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Error al actualizar la contraseña", true);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setNewPassword("");
    setConfirmPassword("");
    setIsEditingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando perfil...</p>
      </div>
    );
  }

  const cropScale = getCropScale();

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-4">
      {/* Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Ajustar foto de perfil
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Arrastra la imagen para elegir qué parte mostrar
            </p>
            <div className="flex justify-center mb-5">
              <div
                className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none ring-2"
                style={{ width: CROP_SIZE, height: CROP_SIZE, "--tw-ring-color": "var(--color-accent)" } as React.CSSProperties}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
              >
                {cropImageSrc && (
                  <Image
                    src={cropImageSrc}
                    alt="Vista previa"
                    width={cropImageDimensions.width * cropScale}
                    height={cropImageDimensions.height * cropScale}
                    unoptimized
                    draggable={false}
                    style={{
                      position: "absolute",
                      width: cropImageDimensions.width * cropScale,
                      height: cropImageDimensions.height * cropScale,
                      transform: `translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCropCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCropConfirm}
                className="flex-1 px-4 py-2 rounded-lg font-medium accent-button transition-colors text-sm"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Mi perfil
      </h1>

      {/* Feedback messages */}
      {errorMessage && (
        <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Perfil
          </span>
          <Button
            onClick={() => setIsEditingName((v) => !v)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </Button>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer overflow-hidden hover:ring-2 transition-all"
              style={{ background: "var(--bg-tertiary)", "--tw-ring-color": "var(--color-accent)" } as React.CSSProperties}
              title="Cambiar foto"
            >
              {preferences?.avatar_url ? (
                <Image src={preferences.avatar_url} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{initials}</span>
              )}
            </div>
            {isUpdatingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">...</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Inline name edit */}
        {isEditingName && (
          <form onSubmit={handleSaveName} className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nombre completo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                autoFocus
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none"
              />
              <Button
                type="submit"
                disabled={isSavingName}
                className="px-4 py-2 text-sm rounded-lg font-medium accent-button transition-colors"
              >
                {isSavingName ? "..." : "Guardar"}
              </Button>
              <Button
                type="button"
                onClick={handleCancelName}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Security card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Contraseña
          </span>
          {!isEditingPassword && (
            <Button
              onClick={() => setIsEditingPassword(true)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </Button>
          )}
        </div>

        {!isEditingPassword ? (
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 tracking-widest">••••••••</p>
        ) : (
          <form onSubmit={handleSavePassword} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={isSavingPassword}
                className="flex-1 px-4 py-2 text-sm rounded-lg font-medium accent-button transition-colors"
              >
                {isSavingPassword ? "Guardando..." : "Cambiar contraseña"}
              </Button>
              <Button
                type="button"
                onClick={handleCancelPassword}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

