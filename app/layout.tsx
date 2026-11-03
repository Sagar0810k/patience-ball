import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/lilita-one/index.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Control Your Balls',
  description: 'A 3D tilt puzzle on a felt and beech board. Roll balls of every size into the green hole that fits them and keep clear of the red ones.',
  openGraph: { title: 'Control Your Balls', description: 'Tilt the board, steer the pile, find the green hole.', type: 'website', images: ['/icons/icon-512.png'] },
  twitter: { card: 'summary', title: 'Control Your Balls', description: 'Tilt the board, steer the pile, find the green hole.', images: ['/icons/icon-512.png'] },
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
      <body><a className="skip" href="#main">Skip to the game menu</a>{children}</body>
    </html>
  );
}
