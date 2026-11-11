import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Geist_Mono } from "next/font/google";
import { GuestCartProvider } from "@/components/shop/guest-cart-context";
import { DevModeFrame } from "@/components/dev/dev-mode-frame";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Editorial display serif. Single weight on purpose — hierarchy comes from
// size and spacing, not weight, which is the minimalist fashion convention.
const fontHeading = Instrument_Serif({
  variable: "--font-heading-family",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATELIER",
  description: "Fashion e-commerce website — CO3027 course project",
};

// viewportFit: "cover" + env(safe-area-inset-*) on the mobile tab bar is what
// keeps the bottom nav clear of a notch/home-indicator on real phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DevModeFrame>
          <GuestCartProvider>{children}</GuestCartProvider>
        </DevModeFrame>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
