import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Lexora — Premium Lawyer Booking & Consultation Platform',
  description: 'Connect with Bangladesh\'s leading verified lawyers. Book instant video, audio, chat, and in-person legal consultations with complete privacy and transparent pricing.',
  keywords: ['Lawyer Bangladesh', 'Legal consultation', 'Lawyer booking', 'bKash payment lawyer', 'Lexora'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
