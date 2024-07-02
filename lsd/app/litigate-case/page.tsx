"use client";

import React, { useState } from 'react';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';

interface CaseDetails {
  caseID: string;
  caseName: string;
  caseFacts: string;
}

const LitigateCase = () => {
  const { user } = useAuth();
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [argument, setArgument] = useState('');

  const handleGenerateCase = async () => {
    // This is a placeholder, you'll need to implement the actual API call
    // const response = await fetch('/api/generate-case', { method: 'POST' });
    // const data = await response.json();
    // setCaseDetails(data);
  };

  const handleSubmitArgument = async () => {
    // This is a placeholder, you'll need to implement the actual API call
    // const response = await fetch('/api/litigate-case', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ caseID: caseDetails.caseID, userID: user.id, side, argument }),
    // });
    // Handle the response...
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8">Litigate Case</h1>
      {!caseDetails ? (
        <Button onClick={handleGenerateCase}>Generate New Case</Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{caseDetails.caseName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{caseDetails.caseFacts}</p>
            {!side ? (
              <div className="mt-4">
                <Button onClick={() => setSide('plaintiff')} className="mr-4">Represent Plaintiff</Button>
                <Button onClick={() => setSide('defendant')}>Represent Defendant</Button>
              </div>
            ) : (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">Your Argument ({side})</h3>
                <Textarea 
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                  placeholder="Enter your legal argument here..."
                  className="mb-4"
                />
                <Button onClick={handleSubmitArgument}>Submit Argument</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LitigateCase;