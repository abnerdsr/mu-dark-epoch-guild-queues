import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mu Laticao App',
  description: 'Mu Dark Epoch Laticao',
  generator: 'zikao',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
