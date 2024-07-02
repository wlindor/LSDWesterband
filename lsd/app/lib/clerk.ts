// lib/clerk.ts
import { ClerkProvider } from '@clerk/nextjs';

const ClerkWrapper = ({ children }: { children: React.ReactNode }) => (
  <ClerkProvider>{children}</ClerkProvider>
);

export default ClerkWrapper;
