import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getBusinessConfig } from "@/lib/business-config";
import { getContrastColor } from "@/lib/color";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getBusinessConfig();
  return {
    title: `${config.businessName} CRM`,
    description: `Client, pipeline, and finance tracker for ${config.businessName}`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getBusinessConfig();
  console.log("start")
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
        style={
          {
            "--brand": config.primaryColor,
            "--brand-foreground": getContrastColor(config.primaryColor),
          } as React.CSSProperties
        }
      >
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar businessName={config.businessName} logoUrl={config.logoUrl} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
