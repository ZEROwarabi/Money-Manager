import type { Metadata } from "next";
import { Klee_One } from "next/font/google";
import "./globals.css";

const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ["latin"],
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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
