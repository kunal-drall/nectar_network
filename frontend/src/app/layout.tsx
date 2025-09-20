import './globals.css'
import type { Metadata } from 'next'
import { Web3Provider } from '@/hooks/useWeb3'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Nectar Network - Decentralized Compute Marketplace',
  description: 'A decentralized marketplace for compute resources on Avalanche',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Web3Provider>
          <div className="min-h-screen">
            <Navbar />
            <main>{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  )
}