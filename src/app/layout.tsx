import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPI - Gestão de Projetos e Iniciativas | DETRAN-SP",
  description: "Sistema de Gestão de Portfólio da Diretoria de TI do DETRAN-SP",
};

import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
