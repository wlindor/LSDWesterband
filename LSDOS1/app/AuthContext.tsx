"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useClerk, useUser } from "@clerk/nextjs";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(!isLoaded);

  useEffect(() => {
    setIsLoading(!isLoaded);
  }, [isLoaded]);

  const value = {
    user: isLoaded ? user : null,
    isLoading,
    signOut: () => signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}