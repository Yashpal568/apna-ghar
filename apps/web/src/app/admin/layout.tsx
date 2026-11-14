import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '../utils/seo';

export const metadata: Metadata = {
  title: 'Admin Console | Apna Ghar',
  robots: NOINDEX_ROBOTS,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
