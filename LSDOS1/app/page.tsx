// app/page.tsx
"use client";

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleStartClick = () => {
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="text-center space-y-6 animate-fade-in">
        <h1 className="text-5xl font-bold text-white font-['Roboto Mono', 'monospace'] animate-blink-cursor">
          ROAI LLP
        </h1>
        <p className="text-2xl text-gray-300 font-['Roboto Mono', 'monospace'] animate-fade-in-delayed">
          Legal Simulation Department
        </p>
        <button
          onClick={handleStartClick}
          className="px-8 py-3 rounded-full bg-[#00FFFF] text-black font-bold font-['Roboto Mono', 'monospace'] hover:bg-[#00CCCC] transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  );
}
