import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { getLocaleOnServer } from '@/i18n/server'

import './styles/globals.css'
import './styles/markdown.scss'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512.png',
    apple: '/apple-touch-icon.png',
  },
}

const LocaleLayout = async ({
  children,
}: {
  children: React.ReactNode
}) => {
  const locale = await getLocaleOnServer()
  return (
    <html lang={locale ?? 'en'} className="h-full">
      <body className="h-full">
        <div className="overflow-x-auto">
          <div className="w-screen h-screen min-w-[300px]">
            {children}
          </div>
        </div>
        {/* Vercel Web Analytics: ページ表示回数の計測(Firebaseのfirst_openと比べて、開いた後に画面が出ているか確認する用) */}
        <Analytics />
      </body>
    </html>
  )
}

export default LocaleLayout
