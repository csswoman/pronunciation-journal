# Supabase desde cero (proyecto nuevo)

## 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) e inicia sesion.
2. **New project** -> elige organizacion, **nombre**, **contrasena de la base de datos** (guardala).
3. Region cercana a ti -> **Create new project** (tarda 1-2 minutos).

## 2. API keys (para tu app Next.js)

1. En el proyecto: **Project Settings** (engranaje) -> **API**.
2. Copia:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (o Legacy anon) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Variables en tu repo

En la raiz del proyecto crea `.env.local` (no lo subas a git; ya suele estar en `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Reinicia `npm run dev` despues de guardar.

## 4. Tabla, seguridad y bucket de audio

1. En Supabase: **SQL Editor** -> **New query**.
2. Abre `supabase/migrations/20260319120000_entries.sql`, copia todo y ejecutalo (**Run**).

Ese script crea:

- tabla `entries`
- politicas RLS para que cada usuario vea solo sus filas
- bucket `user-audio`
- politicas de Storage por carpeta: `auth.uid()/archivo`

## 5. Autenticacion en la app

La interfaz permite **entrar con correo y contrasena**, **registrarse** o **continuar como invitado**.

1. **Email** (recomendado): **Authentication** -> **Providers** -> **Email** -> habilitado (por defecto suele estar activo). Ajusta si quieres confirmacion de correo en la misma pantalla.
2. **Invitado**: **Authentication** -> **Providers** -> **Anonymous** -> **Enable** -> Guardar (necesario para el boton "Continuar como invitado").

Sin sesion no se guardan datos en Supabase: primero debes entrar o elegir invitado.

## 6. Audio en Supabase Storage (ya integrado en el codigo)

Cuando grabas audio:

1. El frontend genera audio local (`data:` o `blob:`).
2. Al guardar la entrada, se sube automaticamente al bucket `user-audio`.
3. En la tabla se guarda una referencia interna (`sb:ruta`).
4. Al leer, la app resuelve esa referencia a URL publica para reproducir.

Al eliminar una entrada, tambien se intenta borrar su archivo de audio.

## 7. Comprobar que funciona

1. `npm run dev`
2. Crea/edita una palabra y graba audio.
3. Verifica en Supabase:
   - **Table Editor** -> `entries`
   - **Storage** -> bucket `user-audio`

Si falla, revisa **Authentication** -> **Users** (deberia aparecer un usuario anonimo) y **Logs** del dashboard.

## 8. Nota sobre Supabase CLI

En esta terminal de Cursor no aparece el comando `supabase` en PATH. Si en tu terminal local si lo tienes, puedes ejecutar el SQL desde el dashboard como arriba, o luego enlazar el proyecto con CLI si prefieres flujo de migraciones.
