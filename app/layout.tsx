import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pronunciation Journal",
  description: "Track and improve your pronunciation",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

