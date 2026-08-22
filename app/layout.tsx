import "./globals.css";
import "./markdown.css";
import { Andika, DM_Sans, DM_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";

// Body + UI + headings — DM Sans
const dmSans = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

// Monospace — kickers, code (not IPA)
const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono-var",
});

// IPA / phonetic transcription — SIL Andika (literacy + full IPA glyph set)
const andika = Andika({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ipa",
  display: "swap",
});

/**
 * Root layout stays free of next/headers dynamic APIs so routes that can
 * be static or CDN-cached are not forced dynamic by a per-request CSP nonce.
 * The theme boot script is authorized via a sha256 hash in `proxy.ts` CSP
 * (see Next.js CSP guide: nonce-based CSP requires dynamic rendering).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Font variable *classes* stay on <body> so React never owns <html className>
  // and cannot wipe a pre-paint `.dark` from the blocking theme script.
  // Family names are also mirrored onto :root so tokens.css composites
  // (--font-body, --font-kicker, …) resolve against DM Sans / Mono / Andika
  // instead of Tailwind's default ui-sans-serif stack on <html>.
  const fontVars = `${dmSans.variable} ${dmMono.variable} ${andika.variable}`;
  const rootFontVars = `:root{--font-sans:${dmSans.style.fontFamily};--font-mono-var:${dmMono.style.fontFamily};--font-ipa:${andika.style.fontFamily};}`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Pronunciation Journal</title>
        <meta name="description" content="Track and improve your pronunciation" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#7c6fcd" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PronJournal" />
        {/* Raw blocking script (not next/script): runs while HTML parses, before paint.
            Authorized by script-src sha256 hash in proxy CSP — not a layout nonce. */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <style
          id="root-font-vars"
          dangerouslySetInnerHTML={{ __html: rootFontVars }}
        />
      </head>
      <body
        className={`${fontVars} bg-surface-base text-fg`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
