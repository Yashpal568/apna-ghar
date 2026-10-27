import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Apna Ghar | Find a place to call home',
    template: '%s | Apna Ghar',
  },
  description: 'Discover homes, flats, villas and plots for sale on Apna Ghar.',
  applicationName: 'Apna Ghar',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body>
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
      </body>
    </html>
  );
}
