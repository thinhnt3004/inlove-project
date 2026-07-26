import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CoupleProvider } from "@/context/CoupleContext";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InLove - Không gian yêu thương",
  description: "Trang web kỷ niệm dành cho hai người",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-slate-900 transition-colors duration-500`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CoupleProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CoupleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
