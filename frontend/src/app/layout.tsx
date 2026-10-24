import type { Metadata } from "next";
import SmoothScroll from "../components/SmoothScroll";
import ThemeProvider from "../components/ThemeProvider";
import { LanguageProvider } from "../store/languageStore";
import "./globals.css";

export const metadata: Metadata = {
  title: "Un-HiReD | AI Career Co-Pilot",
  description: "Your AI career co-pilot for finding a future-ready role in Malaysia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#f2f4f7] font-sans text-gray-900 antialiased dark:bg-[#0f1117] dark:text-white"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
