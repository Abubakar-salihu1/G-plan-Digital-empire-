import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "G-PLAN Digital Empire | Think Bigger. Market Smarter.", description: "AI-powered marketing, creative production and business automation for ambitious brands." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
