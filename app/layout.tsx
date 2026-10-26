import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Patience Balls',
  description: 'A calm 3D marble physics puzzle. Drop marbles through the holes and fill every cup.',
  manifest: '/manifest.json',
  icons: { icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Patience Balls', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#241552',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
