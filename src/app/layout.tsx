import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import { StoreProvider } from "@/store/provider";
import RealtimeProvider from "@/components/providers/realtime-provider";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Toaster } from "react-hot-toast";
import "./globals.css";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lightpulseapp.org"),
  title: "LightPulse - Community Real-time Power Status Tracker",
  description: "Check neighborhood electricity status, report outages, and validate community reports in real time.",
  keywords: ["Nigeria", "Lagos", "power status", "electricity tracking","Light", "PHCN", "NEPA", "blackout tracker", "power outage", "grid update"],
  openGraph: {
    title: "LightPulse - Community Real-time Power Status Tracker",
    description: "Check neighborhood electricity status, report outages, and validate community reports in real time.",
    url: "https://lightpulseapp.org",
    siteName: "LightPulse",
    images: [
      {
        url: "https://lightpulseapp.org/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LightPulse Power Status Tracker",
      }
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LightPulse - Community Real-time Power Status Tracker",
    description: "Check neighborhood electricity status, report outages, and validate community reports in real time.",
    images: ["https://lightpulseapp.org/og-image.jpg"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LightPulse",
  },
  other: {
    "geo.region": "NG-LA",
    "geo.placename": "Lagos",
    "geo.position": "6.5244;3.3792",
    "ICBM": "6.5244, 3.3792",
  }
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-emerald-100 selection:text-emerald-900">
        <StoreProvider>
          <RealtimeProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: "1rem",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.05)",
                  fontSize: "11px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: "800",
                  color: "#1e293b",
                  letterSpacing: "-0.01em",
                  padding: "10px 16px",
                },
              }}
            />
            <Header />
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
              {children}
            </div>
            <BottomNav />
          </RealtimeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
