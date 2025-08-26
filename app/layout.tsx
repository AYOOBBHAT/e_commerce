import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import SessionProvider, { useSession } from '@/components/SessionProvider';
import HeaderWithSession from '@/components/layouts/HeaderWithSession';
import Footer from '@/components/layouts/Footer';
import { SITE_NAME } from '@/lib/constants';
import { CartProvider } from '@/components/CartProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Your one-stop destination for quality products at great prices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <CartProvider>
              <HeaderWithSession />
              <main className="flex-grow pt-16 md:pt-20">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}