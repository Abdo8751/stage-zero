import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'Stage Zero Egypt',
  description:
    'Connect young Egyptian founders with verified investors. Your startup\'s first stage.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-cream font-body font-light text-navy antialiased">
        <ToastProvider>
          <Navbar />
          <main>{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
