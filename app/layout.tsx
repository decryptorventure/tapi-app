import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { MainNav } from "@/components/layout/main-nav";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Tapy - Just-in-Time Recruitment",
  description: "Kết nối nhà hàng Nhật/Hàn với nhân viên part-time tại Việt Nam",
  manifest: "/manifest.json",
  themeColor: "#1e3a8a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tapy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Providers>
          <MainNav />
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}

