import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import AuthListener from "@/components/auth-listener";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import ChatModal from "@/components/chat-modal";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Marble",
  description: "Build beautiful websites effortlessly",
  icons: {
    icon: [
      { url: '/marble_logo_circle.png', type: 'image/png' },
    ],
    apple: [
      { url: '/marble_logo_circle.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#1A1A1A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Analytics />
          <AuthListener />
          <Toaster />
          <ChatModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
