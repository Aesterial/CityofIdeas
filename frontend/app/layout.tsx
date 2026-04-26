import { AuthProvider } from "@/components/auth-provider";
import { LanguageProvider } from "@/components/language-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { MfaRequiredDialog } from "@/components/mfa-required-dialog";
import { NotificationsProvider } from "@/components/notifications-provider";
import { PageLoader } from "@/components/page-loader";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { Days_One, Geist_Mono, Nunito_Sans } from "next/font/google";
import type React from "react";
import "./globals.css";
import { cn } from "@/lib/utils";

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

const daysOne = Days_One({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  weight: "400",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Город Идей",
  description: "Платформа для предложения идей по развитию городов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={cn("font-sans", nunitoSans.variable)}>
      <body className={`${daysOne.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <LanguageProvider>
            <AuthProvider>
              <NotificationsProvider>
                <TooltipProvider>
                  <SmoothScrollProvider>
                    <PageLoader />
                    <MaintenanceBanner />
                    <Toaster position="top-right" richColors closeButton />
                    <MfaRequiredDialog />
                    {children}
                  </SmoothScrollProvider>
                </TooltipProvider>
              </NotificationsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
