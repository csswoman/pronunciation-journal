import "./globals.css";
import "./markdown.css";
import { Bricolage_Grotesque, Figtree, Noto_Sans } from "next/font/google";
import { connection } from "next/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init-script";

// Body + UI — Figtree
const figtree = Figtree({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

// Display — hero word, page titles, headline cards — Bricolage Grotesque
const bricolage = Bricolage_Grotesque({
  weight: ["600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

// IPA / phonetic transcription — Noto Sans (covers ɪ ə ð ː ˈ)
const notoSans = Noto_Sans({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ipa",
  display: "swap",
});

/**
 * A nonce-based CSP requires request-time rendering so Next can add the nonce
 * to its inline RSC payloads and framework scripts. This preserves a strict
 * production CSP without permitting arbitrary inline scripts.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  // Font variable *classes* stay on <body> so React never owns <html className>
  // and cannot wipe a pre-paint `.dark` from the blocking theme script.
  // Family names are also mirrored onto :root so tokens.css composites
  // (--font-body, --font-kicker, …) resolve against DM Sans / Mono / Andika
  // instead of Tailwind's default ui-sans-serif stack on <html>.
  const fontVars = `${figtree.variable} ${bricolage.variable} ${notoSans.variable}`;
  const rootFontVars = `:root{--font-sans:${figtree.style.fontFamily};--font-display:${bricolage.style.fontFamily};--font-ipa:${notoSans.style.fontFamily};}`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>English Journal</title>
        <meta name="description" content="Track and improve your pronunciation" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="English Journal" />
        {/* Raw blocking script (not next/script): runs while HTML parses, before paint.
            Authorized by its sha256 hash and the request nonce in proxy CSP. */}
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
