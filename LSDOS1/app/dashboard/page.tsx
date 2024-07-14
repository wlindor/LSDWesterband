// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useClerk } from "@clerk/nextjs";

const Dashboard = () => {
  const { user } = useAuth();
  const [billableHours, setBillableHours] = useState(0);
  const [cases, setCases] = useState<any[]>([]);
  const router = useRouter();
  const { signOut } = useClerk();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      try {
        // Fetch user data from your backend or Clerk
        const response = await fetch(`/api/users/${user.id}`);
        const data = await response.json();
        setBillableHours(data.billableHours || 0);
        setCases(data.cases || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to the home page after signing out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGenerateCase = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch('/app/api/generate-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle storing case data elsewhere if not using Firestore

      const caseDataString = encodeURIComponent(JSON.stringify(data));
      router.push(`/generate-case?caseData=${caseDataString}`);
    } catch (error) {
      console.error('Error generating case:', error);
    }
  };

  const progress = (billableHours % 2000) / 2000;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-between w-full max-w-4xl mb-4">
        <Button variant="outline" onClick={handleSignOut}>
          Log Out
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">ROAI</h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">LSD</p>
        </div>
        <div className="w-24" />
      </div>
      <div className="flex justify-between w-full max-w-4xl">
        <div className="w-1/3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">File Cabinet</h2>
          <p className="text-slate-700 dark:text-slate-300">Connect to cases</p>
          <ul className="mt-4">
            {cases.map((caseItem, index) => (
              <li key={index} className="mb-2">
                <Button variant="link" onClick={() => router.push(`/cases/${caseItem}`)}>
                  {caseItem}
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center w-1/3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">{cases.length}</div>
          <p className="text-slate-700 dark:text-slate-300">Cases</p>
        </div>
        <div className="flex flex-col items-center justify-between w-1/3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="w-full">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Total Hours Billed</div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-pink-600 bg-pink-200 dark:text-pink-200 dark:bg-pink-800">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-pink-600 dark:text-pink-300">
                    {billableHours} / 2000
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-pink-200 dark:bg-pink-800">
                <div style={{ width: `${progress * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"></div>
              </div>
            </div>
          </div>
          <Button variant="default" onClick={handleGenerateCase} className="mt-4">
            Start Case
          </Button>
          <div className="flex items-center justify-center mt-4">
            <BanknoteIcon className="w-8 h-8 mr-2 text-slate-900 dark:text-slate-100" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">ROAI Earnings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function BanknoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export default Dashboard;