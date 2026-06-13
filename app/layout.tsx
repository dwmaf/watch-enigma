import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from 'react';
import { ToastProvider } from './components/ToastProvider';
import RouteProgressBar from './components/RouteProgressBar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const gameOfThronesFont = localFont({
  src: './fonts/Game of Thrones.ttf',
  display: 'swap',
  variable: '--font-got',
});

export const metadata: Metadata = {
  title: "Screen Enigma",
  description: "My Personal Watch/Reading list consist of movie, series, anime, manga, and manhwa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistSans.variable} ${geistMono.variable} ${gameOfThronesFont.variable} h-full antialiased`} // NEW: Add Plus Jakarta Sans variable
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <Suspense>
            <RouteProgressBar />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
