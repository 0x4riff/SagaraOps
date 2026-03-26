import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "SagaraOps",
  description: "AI-powered SOS report automation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
