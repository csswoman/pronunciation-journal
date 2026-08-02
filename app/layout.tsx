import "./globals.css";
import "./markdown.css";
import { Andika, DM_Sans, DM_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";

// Body + UI + headings — DM Sans
const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fonts live on <body> so React does not own <html className> and wipe a
  // pre-paint `.dark` class set by the blocking theme script.
  const fontVars = `${dmSans.variable} ${dmMono.variable} ${andika.variable}`;

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
        {/* Raw blocking script (not next/script): runs while HTML parses, before paint. */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
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
