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
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
