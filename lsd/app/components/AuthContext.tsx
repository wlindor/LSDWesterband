// app/AuthContext.tsx
"use client";

import React, { createContext, useContext, ReactNode, FC } from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserResource } from '@clerk/types';

interface AuthContextType {
  user: UserResource | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const { user, isLoaded } = useUser();

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};
