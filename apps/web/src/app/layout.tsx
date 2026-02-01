import type { Metadata } from "next";

import { DM_Serif_Display, Inter } from "next/font/google";

import "../index.css";
import { CookieConsentBanner } from "@/components/cookie-consent";
import Providers from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "gemhog",
  description: "gemhog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSerif.variable} antialiased`}>
        <Providers>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
