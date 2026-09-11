import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono, Special_Elite } from "next/font/google";
import { site } from "@/lib/content";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/* Special Elite for the name: a worn, inked typewriter face, so the titles
   look struck onto the page. One weight only. */
const masthead = Special_Elite({
  subsets: ["latin"],
  variable: "--font-masthead-face",
  display: "swap",
  weight: "400",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.fullName} — ${site.role}`,
  description: site.tagline,
  openGraph: {
    title: `${site.fullName} — ${site.role}`,
    description: site.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04121a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${masthead.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
