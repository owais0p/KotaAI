import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KotaAI — Your 24/7 JEE & NEET Tutor",
  description: "AI-powered tutoring platform for JEE and NEET exam preparation. Get instant doubt resolution, daily practice, and personalized progress tracking.",
  keywords: ["KotaAI", "JEE", "NEET", "AI Tutor", "Exam Preparation", "Physics", "Chemistry", "Maths", "Biology"],
  authors: [{ name: "KotaAI Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "KotaAI — Your 24/7 JEE & NEET Tutor",
    description: "AI-powered tutoring for JEE & NEET exam preparation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
