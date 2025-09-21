import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/lib/web3/wallet-connection"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AuctionBuilder - Visual Auction Workflow Platform",
  description: "Create, launch, and automate auction-based sales with secure blockchain integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <WalletProvider>
            {children}
            <Toaster />
          </WalletProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
