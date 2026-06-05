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
        {/* ── Global animated cream highlights — gentle on parchment base ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          {/* Bright white-cream — top-left */}
          <div className="blob-a absolute -top-[22%] -left-[12%] h-[90vh] w-[90vw] rounded-full bg-[radial-gradient(circle,rgba(255,252,230,0.55)_0%,transparent_65%)] blur-[80px]" />
          {/* Bright white-cream — top-right */}
          <div className="blob-b absolute -top-[12%] right-[-18%] h-[75vh] w-[75vw] rounded-full bg-[radial-gradient(circle,rgba(255,250,225,0.48)_0%,transparent_65%)] blur-[80px]" />
          {/* Centre top glow */}
          <div className="blob-c absolute -top-[5%] left-[20%] h-[65vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,252,230,0.45)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-2s' }} />
          {/* Mid page warm */}
          <div className="blob-d absolute top-[38%] left-[5%] h-[58vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(255,248,218,0.35)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-4s' }} />
          <div className="blob-e absolute top-[38%] right-[-5%] h-[52vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,248,218,0.30)_0%,transparent_65%)] blur-[75px]" style={{ animationDelay: '-7s' }} />
          {/* Lower page */}
          <div className="blob-a absolute top-[68%] left-[20%] h-[50vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(255,244,210,0.28)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-9s' }} />
          {/* Very subtle blue accent */}
          <div className="blob-c absolute top-[45%] -left-[8%] h-[40vh] w-[38vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.06)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-5s' }} />
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
