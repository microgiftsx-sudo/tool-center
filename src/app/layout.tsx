import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./Providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "مركز الأدوات",
  description: "أدوات بسيطة وسريعة لمعالجة بيانات Excel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} antialiased`}
        style={{ fontFamily: 'var(--font-cairo), Cairo, system-ui, sans-serif' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
