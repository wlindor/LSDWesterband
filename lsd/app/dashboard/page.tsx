// app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Award, User, Scale, GraduationCap } from 'lucide-react';

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
      const response = await fetch('/api/generate-case', {
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

      const caseDataString = encodeURIComponent(JSON.stringify(data));
      router.push(`/generate-case?caseData=${caseDataString}`);
    } catch (error) {
      console.error('Error generating case:', error);
    }
  };

  const progress = (billableHours % 2000) / 2000 * 100;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <header className="mb-8 flex justify-between items-center">
        <Button variant="outline" onClick={handleSignOut}>Log Out</Button>
        <h1 className="text-3xl font-bold text-center">ROAI LSD</h1>
        <div className="w-20"></div>
      </header>
      <main className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6 items-center">
              <div>
                <h2 className="text-xl font-semibold mb-2">File Cabinet</h2>
                <p className="text-gray-600 dark:text-gray-400">Connect to cases</p>
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
              <div className="text-center">
                <span className="text-4xl font-bold">{cases.length}</span>
                <p>Cases</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Total Hours Billed</h3>
                <Progress value={progress} className="mb-2" />
                <p className="text-right">{billableHours} / 2000</p>
                <Button variant="default" onClick={handleGenerateCase} className="mt-4 w-full">
                  Start Case
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2" />
                Token Bank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0 ROAI</p>
              <p className="text-gray-600 dark:text-gray-400">Tokens earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2" />
                Career Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">Intern</p>
              <Progress value={20} className="mt-2" />
              <p className="text-right text-gray-600 dark:text-gray-400">Next: Associate</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="mr-2" />
                Judge Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">Start Judging</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2" />
                Litigate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">Choose Side</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="mr-2" />
                Grade as Professor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="default" className="w-full">Start Grading</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;