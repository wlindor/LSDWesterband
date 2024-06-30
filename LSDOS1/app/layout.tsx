// app/frontend/layout.tsx
import './styles/globals.css';
import { Inter as FontSans } from 'next/font/google';
import { ReactNode } from 'react';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { cn } from './lib/utils';
import { AuthProvider } from '../app/components/AuthContext';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing Clerk publishableKey');
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
          <AuthProvider>
            <SignedIn>
              {children}
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
