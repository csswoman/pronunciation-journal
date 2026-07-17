import Script from "next/script";
import "./globals.css";
import "./markdown.css";
import { Andika, DM_Sans, DM_Mono } from "next/font/google";

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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmMono.variable} ${andika.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pronunciation Journal</title>
        <meta name="description" content="Track and improve your pronunciation" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#7c6fcd" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PronJournal" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.classList.toggle(
                'dark',
                localStorage.getItem('theme-mode') === 'dark' ||
                (!localStorage.getItem('theme-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
              );
              const savedHue = localStorage.getItem('theme-hue');
              if (savedHue) document.documentElement.style.setProperty('--hue', savedHue);
            `,
          }}
        />
      </head>
      <body className="bg-surface-base text-fg transition-colors" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
