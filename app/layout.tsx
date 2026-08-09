import type { Metadata } from "next";
import { Caveat, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const title = "A Little Invite";
const description =
  "Create a thoughtful invitation for coffee, dinner, a walk, or a moment together.";
const publicSiteUrl = "https://a-little-invite.vercel.app/";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(publicSiteUrl),
    title,
    description,
    applicationName: title,
    verification: {
      google: "n52RWLvWm7q6v8YtcdGv3Hxsnyfgw2YiLlog3AOjrgc",
    },
    keywords: [
      "date invitation",
      "coffee invitation",
      "romantic invitation",
      "outing invitation",
      "online invitation maker",
    ],
    referrer: "no-referrer",
    alternates: {
      canonical: publicSiteUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: publicSiteUrl,
      siteName: title,
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1536,
          height: 1024,
          alt: "A Little Invite paper-art social card",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${cormorant.variable} ${caveat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
