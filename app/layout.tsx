import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Holistic Wellness AI - Your Personal Wellness Companion",
  description: "AI-powered holistic wellness platform integrating nutrition, mental health, and spiritual guidance for a balanced life.",
  keywords: ["wellness", "AI", "nutrition", "mental health", "spirituality", "meditation", "astrology"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
