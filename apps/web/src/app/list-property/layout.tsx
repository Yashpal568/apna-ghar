import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '../utils/seo';

export const metadata: Metadata = {
  title: 'List Property | Apna Ghar',
  robots: NOINDEX_ROBOTS,
};

export default function ListPropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
