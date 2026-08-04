import type { Metadata } from "next";
import { Klee_One, Dancing_Script } from "next/font/google";
import "./globals.css";

const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-dancing-script',
});

export const metadata: Metadata = {
  title: "Smart Money Manager",
  description: "Manage your finances smartly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${kleeOne.className} h-full antialiased`}
    >
      <body className={`${dancingScript.variable} min-h-full flex flex-col`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
