import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markd — Smart Bookmark Manager",
  description: "Save, organize, and access your bookmarks from anywhere. Private, real-time sync.",
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
