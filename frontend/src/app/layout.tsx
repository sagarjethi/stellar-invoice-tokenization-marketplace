import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StellarFlow - Decentralized Invoice Factoring',
  description: 'Tokenize invoices and access instant liquidity on Stellar blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}

