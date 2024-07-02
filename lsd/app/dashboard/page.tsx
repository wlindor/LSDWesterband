"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Award, User, Scale, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import FilingCabinet from '../components/filing-cabinet';

const Dashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
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
        const response = await fetch(`/api/get-user-data?user_id=${user.id}`);
        if (!response.ok) {
          throw new Error(`Error fetching user data: ${response.statusText}`);
        }
        const data = await response.json();
        setUserData(data);
        setBillableHours(data.total_hours || 0);
        setCases(data.submitted_cases || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
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
        const response = await fetch(`/api/generate-case`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: user.id }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status} - ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log('Received data:', data);
            const caseDataString = encodeURIComponent(JSON.stringify(data));
            router.push(`/generate-case?caseData=${caseDataString}`);
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError, 'Response text:', text);
            throw new Error('Error parsing JSON');
        }
    } catch (error) {
        console.error('Error generating case:', error);
    }
  };

  const progress = userData ? (userData.total_hours % 2000) / 2000 * 100 : 0;

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
              {user && <FilingCabinet userId={user.id} />}
              <div className="text-center">
                <span className="text-4xl font-bold">{userData?.completed_cases.length || 0}</span>
                <p>Completed Cases</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Total Hours Billed</h3>
                <Progress value={progress} className="mb-2" />
                <p className="text-right">{billableHours} / 2000</p>
                <Button variant="default" onClick={handleGenerateCase} className="mt-4 w-full">
                  Start New Case
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
              <Link href="/judge-case" passHref>
                <Button variant="default" className="w-full">Start Judging</Button>
              </Link>
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
              <Link href="/litigate-case" passHref>
                <Button variant="default" className="w-full">Choose Side</Button>
              </Link>
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
              <Link href="/grade-case" passHref>
                <Button variant="default" className="w-full">Start Grading</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">File Cabinet</h2>
          <ul className="mt-4">
            {cases.map((caseItem, index) => (
              <li key={index} className="mb-2">
                <Link href={`/cases/${caseItem.id}`}>
                  <Button variant="link">{caseItem.case_name}</Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
