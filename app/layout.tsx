import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "climb.gg — izakr #NA2",
  description: "League of Legends analytics dashboard for izakr #NA2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0e1015] text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
