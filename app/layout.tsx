import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Control Your Balls',
  description: 'A calm 3D marble physics puzzle. Drop marbles through the holes and fill every cup.',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Control Your Balls', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#17302a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
