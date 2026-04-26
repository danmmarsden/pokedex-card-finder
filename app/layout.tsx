import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokePrice Scout",
  description: "Find Pokemon cards by name or camera and compare the cheapest places to buy them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
