import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import SplashScreen from "@/components/SplashScreen";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Help Desk Admin",
  description: "Admin Hub for AI Help Desk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-800 text-white`}>
        <LanguageProvider>
          <div className="flex h-screen overflow-hidden">
            <SplashScreen />
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}

