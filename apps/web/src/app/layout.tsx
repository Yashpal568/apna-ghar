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
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          id="tailwind-config"
          dangerouslySetInnerHTML={{
            __html: `tailwind.config = {
              darkMode: "class",
              theme: {
                extend: {
                  colors: {
                    primary: "#0045b7",
                    "primary-container": "#005bea",
                    "primary-fixed": "#dbe1ff",
                    "primary-fixed-dim": "#b3c5ff",
                    "on-primary": "#ffffff",
                    "on-primary-container": "#dfe5ff",
                    "on-primary-fixed": "#00174a",
                    "on-primary-fixed-variant": "#003ea6",
                    secondary: "#006d3d",
                    "secondary-container": "#50fd9f",
                    "secondary-fixed": "#5affa3",
                    "secondary-fixed-dim": "#28e288",
                    "on-secondary": "#ffffff",
                    "on-secondary-container": "#007240",
                    "on-secondary-fixed": "#00210f",
                    surface: "#f8f9ff",
                    background: "#f8f9ff",
                    "surface-container-lowest": "#ffffff",
                    "surface-container-low": "#eff4ff",
                    "surface-container": "#e5eeff",
                    "surface-container-high": "#dce9ff",
                    "surface-container-highest": "#d3e4fe",
                    "on-surface": "#0b1c30",
                    "on-surface-variant": "#424655",
                    outline: "#737687",
                    "outline-variant": "#c3c6d8",
                    error: "#ba1a1a",
                    "error-container": "#ffdad6"
                  },
                  borderRadius: {
                    xl: "0.75rem",
                    "2xl": "1rem"
                  },
                  fontFamily: {
                    sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
                    "body-md": ["Plus Jakarta Sans"],
                    "headline-sm": ["Plus Jakarta Sans"],
                    "headline-md": ["Plus Jakarta Sans"],
                    "headline-lg": ["Plus Jakarta Sans"],
                    "headline-xl": ["Plus Jakarta Sans"]
                  }
                }
              }
            };`,
          }}
        />
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
