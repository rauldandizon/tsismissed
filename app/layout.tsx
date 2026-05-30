import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TsisMissed",
  description: "Chika. Chat. Call. Never Missed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-tsismis-bg text-tsismis-text">
        <Providers>
          <div className="min-h-full flex flex-col animate-in fade-in duration-150">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
