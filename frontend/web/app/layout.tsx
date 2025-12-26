import { AuthProvider } from "@/components/auth-provider"
import { LanguageProvider } from "@/components/language-provider"
import { PageLoader } from "@/components/page-loader"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Days_One } from "next/font/google"
import type React from "react"
import "./globals.css"




const daysOne = Days_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Город Идей",
  description: "Платформа для предложения идей по развитию городов",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU" type="text/javascript"></script>
      </head>
      <body className={`${daysOne.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <LanguageProvider>
            <AuthProvider>
              <PageLoader />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
