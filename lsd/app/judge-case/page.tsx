"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const JudgeCase = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    // Fetch available cases to judge
    // This is a placeholder, you'll need to implement the actual API call
    const fetchCases = async () => {
      // const response = await fetch('/api/cases-to-judge');
      // const data = await response.json();
      // setSubmissions(data);
    };
    fetchCases();
  }, []);

  const handleSelectCase = (caseId: React.SetStateAction<null>) => {
    setSelectedCase(caseId);
    // Fetch submissions for this case
    // This is a placeholder, you'll need to implement the actual API call
    // const fetchSubmissions = async () => {
    //   const response = await fetch(`/api/judge-case?case_id=${caseId}`);
    //   const data = await response.json();
    //   setSubmissions(data);
    // };
    // fetchSubmissions();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8">Judge Cases</h1>
      {selectedCase ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Case {selectedCase}</h2>
          {submissions.map((submission, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle>Submission from {submission.userID}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{submission.argument}</p>
                <Button className="mt-4">Judge this submission</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Select a case to judge:</h2>
          {/* List of cases to judge */}
        </div>
      )}
    </div>
  );
};

export default JudgeCase;