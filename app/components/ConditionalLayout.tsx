'use client';

import { usePathname } from 'next/navigation';
import { Header } from './new/Header';
import { Footer } from './new/Footer';
import { cn } from '@/lib/utils';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const hideFooter = pathname?.startsWith('/calculadorateste');
  const isCalculadoraTeste = pathname?.startsWith('/calculadorateste');
  const isCalculadoraMudanca = pathname?.startsWith('/calcularmudanca');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {!isCalculadoraMudanca && <Header />}
      <main className={cn("flex-grow", isCalculadoraTeste ? "pt-0" : "pt-16 lg:pt-20")}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}

