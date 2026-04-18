"use client";

import Script from "next/script";
import "./globals.css";
import "./markdown.css";
import { Plus_Jakarta_Sans, Noto_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const plusJakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-heading",
});
const notoSans = Noto_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
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
      className={`${plusJakarta.variable} ${notoSans.variable}`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pronunciation Journal</title>
        <meta name="description" content="Track and improve your pronunciation" />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body className="transition-colors" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }} suppressHydrationWarning>
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
            <div className="flex h-screen bg-[var(--page-bg)] overflow-hidden">
              <Sidebar className="hidden lg:flex w-64 flex-col" />
              <main className="main-scrollbar flex-1 overflow-y-auto pb-20 lg:pb-0">
                <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-8 lg:py-9 bg-[var(--card-bg)] rounded-[15px] my-10 !p-0">
                  {children}
                </div>
              </main>
              <BottomNav className="lg:hidden" />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

