"use client";

import { useState, useRef, useEffect } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import ColorPicker from "@/components/ColorPicker";
import { type ThemeName, DEFAULT_THEME, resolveThemeName } from "@/lib/themes";

type TabType = "appearance" | "security";

export default function ProfileSettings() {
  const { user } = useAuth();
  const {
    preferences,
    loading,
    error,
    updateFullName,
    updateAvatar,
    updateThemeMode,
    updateAccentColor,
    updatePassword,
  } = useUserPreferences();

  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>("appearance");
  const [fullName, setFullName] = useState(preferences?.full_name || "");
  const [tempThemeMode, setTempThemeMode] = useState<"light" | "dark" | "auto">(
    preferences?.theme_mode || "auto"
  );
  const [tempTheme, setTempTheme] = useState<ThemeName>(
    resolveThemeName(preferences?.accent_color ?? DEFAULT_THEME)
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update states when preferences load
  useEffect(() => {
    if (preferences?.full_name) {
      setFullName(preferences.full_name);
    }
    if (preferences?.theme_mode) {
      setTempThemeMode(preferences.theme_mode);
      // sync global theme provider
      try {
        const mapped = preferences.theme_mode === "auto" ? "system" : preferences.theme_mode;
        theme.setMode(mapped as "light" | "dark" | "system");
      } catch (e) {}
    }
    if (preferences?.accent_color) {
      setTempTheme(resolveThemeName(preferences.accent_color));
      try {
        theme.setTheme(resolveThemeName(preferences.accent_color));
      } catch (e) {}
    }
  }, [preferences?.full_name, preferences?.theme_mode, preferences?.accent_color]);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingAvatar(true);
      await updateAvatar(file);
      showMessage("Foto de perfil actualizada exitosamente");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Error al actualizar la foto",
        true
      );
    } finally {
      setIsUpdatingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showMessage("El nombre no puede estar vacío", true);
      return;
    }

    try {
      setIsSavingName(true);
      await updateFullName(fullName);
      showMessage("Nombre actualizado exitosamente");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Error al actualizar el nombre",
        true
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveThemeSettings = async () => {
    try {
      setIsSavingTheme(true);

      // Update theme mode
      if (tempThemeMode !== preferences?.theme_mode) {
        await updateThemeMode(tempThemeMode);
      }

      // Update theme
      if (tempTheme !== resolveThemeName(preferences?.accent_color ?? DEFAULT_THEME)) {
        await updateAccentColor(tempTheme);
      }

      showMessage("Configuración de tema guardada exitosamente");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Error al guardar la configuración",
        true
      );
    } finally {
      setIsSavingTheme(false);
    }
  };

  const hasThemeChanges =
    tempThemeMode !== preferences?.theme_mode ||
    tempTheme !== resolveThemeName(preferences?.accent_color ?? DEFAULT_THEME);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      showMessage("La nueva contraseña no puede estar vacía", true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("Las contraseñas no coinciden", true);
      return;
    }

    if (newPassword.length < 6) {
      showMessage("La contraseña debe tener al menos 6 caracteres", true);
      return;
    }

    try {
      setIsSavingPassword(true);
      await updatePassword(newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("Contraseña actualizada exitosamente");
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : "Error al actualizar la contraseña",
        true
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Configuración del Perfil
      </h1>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "appearance"
                ? "border-transparent"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
            style={activeTab === "appearance" ? { borderBottomColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'rgba(var(--accent-rgb), 0.08)' } : undefined}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267"
                />
              </svg>
              Apariencia
            </span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "security"
                ? "border-transparent"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
            style={activeTab === "security" ? { borderBottomColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'rgba(var(--accent-rgb), 0.08)' } : undefined}
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Seguridad
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-8">
              {/* Profile Photo Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Foto de Perfil
                </h2>

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div
                      onClick={handleAvatarClick}
                      className="w-32 h-32 rounded-full flex items-center justify-center cursor-pointer hover:ring-4 transition-all overflow-hidden"
                      style={{ background: 'linear-gradient(to bottom right, var(--color-accent), var(--accent-hover))', '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                    >
                      {preferences?.avatar_url ? (
                        <img
                          src={preferences.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-6xl">👤</span>
                      )}
                    </div>
                    {isUpdatingAvatar && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">Cargando...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      Haz clic en la imagen para cambiarla
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUpdatingAvatar}
                      className="px-6 py-2 rounded-lg transition-colors font-medium accent-button"
                    >
                      Seleccionar Foto
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme Settings Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Configuración de Tema
                </h2>

                <div className="space-y-6">
                  {/* Theme Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Modo de Tema
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["light", "dark", "auto"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setTempThemeMode(mode);
                            try {
                              const mapped = mode === "auto" ? "system" : mode;
                              theme.setMode(mapped as "light" | "dark" | "system");
                            } catch (e) {}
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            tempThemeMode === mode
                              ? "ring-2"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                          style={tempThemeMode === mode ? { backgroundColor: 'var(--color-accent)', color: 'var(--accent-text)', '--tw-ring-color': 'rgba(var(--accent-rgb), 0.4)' } as React.CSSProperties : undefined}
                        >
                          {mode === "light"
                            ? "☀️ Claro"
                            : mode === "dark"
                              ? "🌙 Oscuro"
                              : "🔄 Auto"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <ColorPicker
                      selectedTheme={tempTheme}
                      onThemeChange={(t) => {
                        setTempTheme(t);
                        try {
                          theme.setTheme(t);
                        } catch (e) {}
                      }}
                      isLoading={false}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveThemeSettings}
                      disabled={isSavingTheme || !hasThemeChanges}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                        hasThemeChanges && !isSavingTheme
                          ? "accent-button shadow-lg hover:shadow-xl"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isSavingTheme ? "Guardando..." : hasThemeChanges ? "Guardar Cambios" : "Sin cambios"}
                    </button>
                    {hasThemeChanges && (
                      <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-accent)' }}>
                        Tienes cambios sin guardar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Información Personal
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email no puede ser modificado
                    </p>
                  </div>

                  <form onSubmit={handleSaveName}>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Nombre Completo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                      />
                      <button
                        type="submit"
                        disabled={isSavingName}
                        className="px-6 py-2 rounded-lg transition-colors font-medium accent-button"
                      >
                        {isSavingName ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Change Password */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Cambiar Contraseña
                </h2>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Por seguridad, confirmaremos tu identidad
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full px-6 py-2 font-medium rounded-lg transition-colors accent-button"
                  >
                    {isSavingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
