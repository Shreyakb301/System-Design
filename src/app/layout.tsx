import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Visual System Design",
  description: "Interactive visual explanations of system design and data structures.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

// Ensure phones render at device width (not zoomed-out desktop). Zoom left
// enabled for accessibility. themeColor improves the mobile browser chrome.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <PageTransition>{children}</PageTransition>
        </div>
      </body>
    </html>
  );
}
