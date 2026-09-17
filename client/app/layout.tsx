import { Providers } from "./providers";
import type { Metadata } from "next";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory Manager",
  description: "Inventory, sales, and payments management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
