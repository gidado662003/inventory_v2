import { Providers } from "./providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Manager",
  description: "Inventory, sales, and payments management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
