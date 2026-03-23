import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trust🔁Deal | منصة الأصول الرقمية الآمنة",
  description: "منصة Trust Deal هي وسيط آمن لبيع وشراء الأصول الرقمية والحسابات والخدمات باستخدام نظام Escrow المتكامل",
  keywords: "escrow, digital assets, social media accounts, subscriptions, secure trading, منصة رقمية",
  openGraph: {
    title: "Trust🔁Deal | منصة الأصول الرقمية الآمنة",
    description: "بيع وشراء آمن للأصول الرقمية مع نظام الوساطة الأمينة",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
