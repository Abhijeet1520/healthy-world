import './globals.css'
import { Poppins } from 'next/font/google'
import { MinikitProvider } from '@/components/minikit-provider';
import { ErudaProvider } from "@/components/Eruda";
import { HealthDataProvider } from '@/components/health-data-provider'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: 'HealthyWorld',
  description: 'Track your health, challenge yourself, and earn rewards with WorldID',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/icon?family=Material+Icons" 
          rel="stylesheet" 
        />
      </head>
      <body className={poppins.className}>
      <ErudaProvider>
        <MinikitProvider>
          <HealthDataProvider>
            {children}
          </HealthDataProvider>
        </MinikitProvider>
      </ErudaProvider>
      </body>
    </html>
  )
} 