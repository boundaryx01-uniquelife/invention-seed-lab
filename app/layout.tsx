import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "발명씨앗 Lab - 초·중·고 발명대회 & 특허 아이디어 생성 플랫폼",
  description: "초·중·고 학생들의 발명품 경진대회 및 특허 출원이 가능한 참신한 발명 아이디어를 생성하고, 체계적인 점수 평가와 실패 데이터 분석을 통해 우수한 아이디어로 발전시키는 전문 발명 코칭 연구실입니다.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "발명씨앗",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
