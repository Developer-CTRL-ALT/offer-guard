import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Evidence-first scam detection for job offers, recruiter messages, and hiring conversations.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = (
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000"
  )
    .split(",")[0]
    .trim();
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const protocol =
    forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "OfferGuard",
      template: "%s · OfferGuard",
    },
    description: siteDescription,
    applicationName: "OfferGuard",
    category: "Web Application",
    keywords: [
      "job scam detector",
      "offer verification",
      "recruitment fraud",
      "student safety",
    ],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      url: origin,
      siteName: "OfferGuard",
      title: "OfferGuard — Test the message before you trust the offer",
      description: siteDescription,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1824,
          height: 911,
          alt: "OfferGuard explainable job-offer risk screening",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "OfferGuard — Test the message before you trust the offer",
      description: siteDescription,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#080a0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
