import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '../utils/seo';

export const metadata: Metadata = {
  title: 'My Listings | Apna Ghar',
  robots: NOINDEX_ROBOTS,
};

export default function MyListingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
