import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import SessionProvider from '@/components/SessionProvider';
import HeaderWithSession from '@/components/layouts/HeaderWithSession';
import Footer from '@/components/layouts/Footer';
import { CartProvider } from '@/components/CartProvider';
import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from '@/lib/structured-data';
import Script from 'next/script';
import { getNavCategories } from '@/lib/actions/categories';
import { getStorefrontSettings } from '@/lib/storefront-settings';
import { StorefrontSettingsProvider } from '@/components/StorefrontSettingsProvider';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial'],
});

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getStorefrontSettings();

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: 'Your one-stop destination for quality products at great prices.',
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      siteName: storeName,
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
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [storefrontSettings, navCategories] = await Promise.all([
    getStorefrontSettings(),
    getNavCategories(),
  ]);

  const orgStructuredData = generateOrganizationStructuredData(baseUrl, {
    storeName: storefrontSettings.storeName,
    storeEmail: storefrontSettings.storeEmail,
  });
  const websiteStructuredData = generateWebsiteStructuredData(baseUrl, {
    storeName: storefrontSettings.storeName,
  });

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
            <StorefrontSettingsProvider value={storefrontSettings}>
              <CartProvider>
                <HeaderWithSession
                  navCategories={navCategories}
                  storeName={storefrontSettings.storeName}
                />
                <main className="flex-grow pt-14 sm:pt-16 lg:pt-20">
                  {children}
                </main>
                <Footer
                  navCategories={navCategories}
                  storeName={storefrontSettings.storeName}
                  storeEmail={storefrontSettings.storeEmail}
                  storePhone={storefrontSettings.storePhone}
                />
              </CartProvider>
            </StorefrontSettingsProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
