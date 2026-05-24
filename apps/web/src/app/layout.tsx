import type { Metadata } from "next";
import "./globals.css";
import { MainLayout } from "@/components/shell/main-layout";

export const metadata: Metadata = {
  title: "كابيلا — نظام تخطيط الموارد",
  description: "كابيلا ERP — إدارة الموردين والعمليات",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
