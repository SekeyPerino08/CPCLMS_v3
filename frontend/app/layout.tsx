import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPC Library | Smart Library Management System",
  description:
    "A modern, smart library management system for Colegio de Porta Coeli. Manage books, borrow requests, reservations, and more.",
  keywords: [
    "library",
    "management",
    "CPC",
    "Colegio de Porta Coeli",
    "books",
    "catalog",
  ],
  manifest: "/manifest.json",
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    title: "CPC Library",
    statusBarStyle: "default",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "48x48" },
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icons/icon-512x512.png", sizes: "512x512" },
  ],
  openGraph: {
    title: "CPC Library",
    description: "Smart Library Management System for Colegio de Porta Coeli",
    type: "website",
    locale: "en_PH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <main className="flex-1">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

