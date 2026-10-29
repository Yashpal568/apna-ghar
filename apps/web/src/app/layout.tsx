import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
import './globals.css';
import MobileBottomNav from './components/MobileBottomNav';

export const metadata: Metadata = {
  title: {
    default: 'Apna Ghar | Find a place to call home',
    template: '%s | Apna Ghar',
  },
  description: 'Discover homes, flats, villas and plots for sale on Apna Ghar.',
  applicationName: 'Apna Ghar',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&amp;display=swap" rel="stylesheet" />
      </head>
      <body>
        {process.env.VERCEL === '1' ? (
          <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
        ) : null}
        {publishableKey ? (
          <ClerkProvider
            publishableKey={publishableKey}
            localization={{
              signIn: {
                start: {
                  title: 'Sign in to Apna Ghar',
                  subtitle: 'Welcome back! Please sign in to continue',
                },
              },
              signUp: {
                start: {
                  title: 'Create your Apna Ghar account',
                  subtitle: 'Find a place to call home',
                },
              },
            }}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
        <MobileBottomNav />
      </body>
    </html>
  );
}
