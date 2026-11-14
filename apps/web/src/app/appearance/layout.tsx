import type { Metadata } from 'next';
import { NOINDEX_ROBOTS } from '../utils/seo';

export const metadata: Metadata = {
  title: 'Appearance Settings | Apna Ghar',
  robots: NOINDEX_ROBOTS,
};

export default function AppearanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
