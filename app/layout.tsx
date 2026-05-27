import Script from "next/script";
import "./globals.css";
import "./markdown.css";
import { Noto_Sans, Fraunces } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import AppShell from "@/components/layout/AppShell";

// Body + UI — Noto Sans covers Latin and Latin Extended (IPA symbols)
const notoSans = Noto_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

// Decorative / editorial headings
const fraunces = Fraunces({
  weight: "variable",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-editorial",
  axes: ["opsz"],
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
      className={`${notoSans.variable} ${fraunces.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pronunciation Journal</title>
        <meta name="description" content="Track and improve your pronunciation" />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className="bg-surface-base text-fg transition-colors" suppressHydrationWarning>
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
        <AuthProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

