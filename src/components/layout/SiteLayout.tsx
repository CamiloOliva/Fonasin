import type { ReactNode } from 'react';
import Footer from '../footer/Footer';
import Navbar from '../navbar/Navbar';
import FloatingActions from '../ui/FloatingActions';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </div>
  );
}
