import type { Metadata } from "next";
import { Instrument_Serif, Inter, Geist_Mono } from "next/font/google";
import { GuestCartProvider } from "@/components/shop/guest-cart-context";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontHeading.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GuestCartProvider>{children}</GuestCartProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
