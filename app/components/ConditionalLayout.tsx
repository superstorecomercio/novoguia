'use client';

import { usePathname } from 'next/navigation';
import { Header } from './new/Header';
import { Footer } from './new/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </>
  );
}

