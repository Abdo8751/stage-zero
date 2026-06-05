import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/Navbar'
import { ToastProvider } from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Stage Zero — Where Capital Meets Vision',
  description:
    "Egypt's premier marketplace connecting verified investors with the next generation of founders.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg-base font-sans antialiased">
        {/* ── Global animated cream blobs — cream dominant ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          {/* Large cream — top-left, primary */}
          <div className="blob-a absolute -top-[22%] -left-[12%] h-[90vh] w-[90vw] rounded-full bg-[radial-gradient(circle,rgba(243,224,155,0.55)_0%,transparent_65%)] blur-[80px]" />
          {/* Cream — top-right */}
          <div className="blob-b absolute -top-[12%] right-[-18%] h-[75vh] w-[75vw] rounded-full bg-[radial-gradient(circle,rgba(241,228,190,0.48)_0%,transparent_65%)] blur-[80px]" />
          {/* Cream — centre top (fills the middle) */}
          <div className="blob-c absolute -top-[5%] left-[20%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(243,222,152,0.42)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-2s' }} />
          {/* Cream — mid page */}
          <div className="blob-d absolute top-[38%] left-[5%] h-[60vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(241,220,148,0.32)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-4s' }} />
          <div className="blob-e absolute top-[38%] right-[-5%] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(241,220,148,0.28)_0%,transparent_65%)] blur-[75px]" style={{ animationDelay: '-7s' }} />
          {/* Cream — lower page */}
          <div className="blob-a absolute top-[65%] left-[20%] h-[50vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(240,218,144,0.22)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-9s' }} />
          {/* Blue — subtle accent mid-left */}
          <div className="blob-c absolute top-[42%] -left-[8%] h-[45vh] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.10)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-5s' }} />
          {/* Amber — bottom accent */}
          <div className="blob-b absolute bottom-[-5%] right-[8%] h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(232,165,60,0.12)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-6s' }} />
        </div>

        <ToastProvider>
          <div className="relative" style={{ zIndex: 1 }}>
            <Navbar />
            <main>{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
