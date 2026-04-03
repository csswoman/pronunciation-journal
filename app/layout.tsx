"use client";

import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
              // Initialize dark mode
              document.documentElement.classList.toggle(
                'dark',
                localStorage.getItem('theme-mode') === 'dark' || 
                (!localStorage.getItem('theme-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
              );
              
              // Initialize hue
              const savedHue = localStorage.getItem('theme-hue');
              if (savedHue) {
                document.documentElement.style.setProperty('--hue', savedHue);
              }
            `,
          }}
        />
        <AuthProvider>
          <ThemeProvider>
            <div className="flex">
              <Sidebar />
              <main className="flex-1 w-full">{children}</main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

