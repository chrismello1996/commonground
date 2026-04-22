import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommonGround — Live Video Debates on the Topics That Matter",
  description:
    "Pick your stance, get matched with someone who disagrees, and settle it live on video. No censorship. No script. The audience decides who wins.",
  keywords: [
    "debate",
    "video debate",
    "live debate",
    "politics",
    "economics",
    "philosophy",
    "free speech",
    "CommonGround",
  ],
  authors: [{ name: "CommonGround" }],
  openGraph: {
    type: "website",
    siteName: "CommonGround",
    title: "CommonGround — Live Video Debates",
    description:
      "Pick your stance. Get matched with your opposite. Settle it on camera.",
    url: "https://commongrounddebate.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CommonGround — Live Video Debates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CommonGround — Live Video Debates",
    description:
      "Pick your stance. Get matched with your opposite. Settle it on camera.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
