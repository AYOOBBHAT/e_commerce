import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import SessionProvider from '@/components/SessionProvider';
import HeaderWithSession from '@/components/layouts/HeaderWithSession';
import Footer from '@/components/layouts/Footer';
import { SITE_NAME } from '@/lib/constants';
import { CartProvider } from '@/components/CartProvider';
import { generateOrganizationStructuredData, generateWebsiteStructuredData } from '@/lib/structured-data';
import Script from 'next/script';
import { getNavCategories } from '@/lib/actions/categories';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Your one-stop destination for quality products at great prices.',
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: SITE_NAME,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgStructuredData = generateOrganizationStructuredData(baseUrl);
  const websiteStructuredData = generateWebsiteStructuredData(baseUrl);
  const navCategories = await getNavCategories();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="organization-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(orgStructuredData),
          }}
        />
        <Script
          id="website-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            <CartProvider>
              <HeaderWithSession navCategories={navCategories} />
              <main className="flex-grow pt-14 sm:pt-16 lg:pt-20">
                {children}
              </main>
              <Footer navCategories={navCategories} />
            </CartProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
