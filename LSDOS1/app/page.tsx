// app/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useEffect } from 'react';
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/app/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-2xl font-['Roboto Mono', 'monospace'] animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="text-center space-y-8 animate-fade-in">
        <h1 className="text-6xl font-bold text-white font-['Roboto Mono', 'monospace'] animate-blink-cursor">
          ROAI LLP
        </h1>
        <p className="text-2xl text-gray-300 font-['Roboto Mono', 'monospace'] animate-fade-in-delayed">
          Legal Simulation Department
        </p>
        <SignInButton mode="modal">
          <Button 
            variant="default" 
            size="lg"
            className="bg-[#00FFFF] text-black hover:bg-[#00CCCC] font-['Roboto Mono', 'monospace']"
          >
            Start
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}