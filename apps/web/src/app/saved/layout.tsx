import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '../utils/seo';

export const metadata: Metadata = {
  title: 'Saved Properties | Apna Ghar',
  robots: NOINDEX_ROBOTS,
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
