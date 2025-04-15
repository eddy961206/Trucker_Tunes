import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner'; // sonner 임포트 추가

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Trucker Tunes',
  description: 'A radio station for truckers'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClass = `antialiased ${geistSans.variable} ${geistMono.variable}`;
  return (
    <html lang="en">
      <body className={bodyClass}>
        {children}
        <Toaster richColors position="bottom-right" /> {/* Toaster 추가 */}
      </body>
    </html>
  );
}
