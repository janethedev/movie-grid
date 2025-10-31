import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import ApiWarmer from '@/components/ApiWarmer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  // Used to construct absolute canonical/alternate URLs
  metadataBase: new URL("https://gamegrid.shatranj.space"),
  title: "电影生涯个人喜好表",
  description: "创建你的电影生涯个人喜好表",
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
    <html lang="zh-CN">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <Analytics />
        <ApiWarmer />
        {children}
      </body>
    </html>
  )
}
