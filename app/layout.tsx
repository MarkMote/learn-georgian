import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "@/components/Header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Learn Georgian",
    template: "%s | Learn Georgian"
  },
  description: "Master Georgian vocabulary with spaced repetition flashcards and AI-powered lessons",
  keywords: ["Georgian", "language learning", "flashcards", "spaced repetition", "vocabulary", "Georgia"],
  authors: [{ name: "Mark" }],
  creator: "Mark",
  applicationName: "Learn Georgian",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "icon", url: "/favicon.ico" }
    ]
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learn Georgian"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Learn Georgian",
    description: "Master Georgian vocabulary with spaced repetition flashcards and AI-powered lessons",
    siteName: "Learn Georgian"
  },
  twitter: {
    card: "summary",
    title: "Learn Georgian",
    description: "Master Georgian vocabulary with spaced repetition flashcards and AI-powered lessons"
  },
  robots: {
    index: true,
    follow: true
  },
  category: "education"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-black bg-gray-50`}
      >
        {/* <Header /> */}
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}