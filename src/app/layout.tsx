import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KotaAI — Your 24/7 JEE & NEET Tutor",
  description: "AI-powered tutoring platform for JEE and NEET exam preparation. Get instant doubt resolution, daily practice, and personalized progress tracking.",
  keywords: ["KotaAI", "JEE", "NEET", "AI Tutor", "Exam Preparation", "Physics", "Chemistry", "Maths", "Biology"],
  authors: [{ name: "KotaAI Team" }],
  icons: {
    icon: "/logo.svg",
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
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
