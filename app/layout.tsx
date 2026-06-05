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
        {/* ── Global animated cream blobs — visible on every page ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="blob-a absolute -top-[22%] -left-[12%] h-[80vh] w-[80vw] rounded-full bg-[radial-gradient(circle,rgba(243,224,155,0.32)_0%,transparent_65%)] blur-[90px]" />
          <div className="blob-b absolute -top-[12%] right-[-18%] h-[65vh] w-[65vw] rounded-full bg-[radial-gradient(circle,rgba(240,228,196,0.22)_0%,transparent_65%)] blur-[80px]" />
          <div className="blob-c absolute top-[35%] -left-[10%] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.10)_0%,transparent_65%)] blur-[80px]" />
          <div className="blob-b absolute bottom-[-8%] right-[3%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(232,165,60,0.09)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-6s' }} />
          <div className="blob-d absolute top-[50%] right-[-5%] h-[45vh] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(240,220,175,0.12)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-3s' }} />
          <div className="blob-e absolute bottom-[5%] left-[10%] h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.08)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-5s' }} />
          <div className="blob-c absolute top-[8%] left-[35%] h-[38vh] w-[38vw] rounded-full bg-[radial-gradient(circle,rgba(243,218,150,0.15)_0%,transparent_65%)] blur-[60px]" style={{ animationDelay: '-2s' }} />
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
