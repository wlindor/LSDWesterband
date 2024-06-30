// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { cn } from './lib/utils';
import { AuthProvider } from './AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing Clerk publishableKey');
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className={cn('min-h-screen bg-gray-100 dark:bg-gray-900 font-sans antialiased')}>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <SignedIn>
                  {children}
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </main>
            </div>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}