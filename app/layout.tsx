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
    <html lang="en">
      <body className="bg-white text-[#37352f] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
