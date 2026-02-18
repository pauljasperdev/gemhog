import type { Metadata } from "next";

import { DM_Sans, Urbanist } from "next/font/google";

import "../index.css";
import { CookieConsentBanner } from "@/components/cookie-consent";
import Providers from "@/components/providers";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urbanist",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gemhog — We listen to financial podcasts so you don't have to",
  description:
    "Expert stock picks and investment theses from 200+ podcasts. Delivered in 5 minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${urbanist.variable} ${dmSans.variable} antialiased`}>
        <Providers>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
