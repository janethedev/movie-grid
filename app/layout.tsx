import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ApiWarmer from '@/components/ApiWarmer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  // Used to construct absolute canonical/alternate URLs
  metadataBase: new URL("https://moviegrid.dsdev.ink"),
  title: "电影生涯个人喜好表",
  description: "创建你的电影生涯个人喜好表",
  themeColor: '#ffffff',
  colorScheme: 'light',
  other: {
    'color-scheme': 'light only',
  },
  verification: {
    google: "swtOMxSQC6Dfn-w4YtMQ3OFH4SZz00Blcd6FI0qMgJc",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Root is kept minimal; middleware redirects to /<locale> paths
  return (
    <html lang="zh-CN" className="light" style={{ colorScheme: 'light only' }}>
      <head>
        <meta name="color-scheme" content="light only" />
        <GoogleAnalytics />
      </head>
      <body className={inter.className} style={{ colorScheme: 'light only' }}>
        <ApiWarmer />
        {children}
      </body>
    </html>
  )
}
