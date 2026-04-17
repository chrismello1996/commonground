import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CommonGround — Live Video Debates on the Topics That Matter",
  description:
    "Pick your stance, get matched with someone who disagrees, and settle it live on video. Free speech through fair debate.",
  metadataBase: new URL("https://commongrounddebate.com"),
  keywords: [
    "debate",
    "live debate",
    "video debate",
    "free speech",
    "politics",
    "economics",
    "philosophy",
    "omegle",
    "discussion",
    "argue",
    "opinion",
  ],
  authors: [{ name: "CommonGround" }],
  openGraph: {
    type: "website",
    siteName: "CommonGround",
    title: "CommonGround — Live Video Debates",
    description:
      "Pick your stance, get matched with someone who disagrees, and settle it live on video.",
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
      "Pick your stance, get matched with someone who disagrees, and settle it live on video.",
    images: ["/og-image.png"],
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
        <meta name="theme-color" content="#030712" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
