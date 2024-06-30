"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { useAuth } from "@/app/AuthContext";

interface CaseData {
  case_id: string;
  case_facts: string;
  // Add other case properties if needed
}

const GenerateCase = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    const generateCase = async () => {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      try {
        const response = await fetch('@/api/generate-case', {
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
        setCaseData(data);

        // Perform any additional setup if necessary
      } catch (error) {
        console.error('Error generating case:', error);
      }
      setLoading(false);
    };

    generateCase();
  }, [user]);

  const handleSubmitAnalysis = async () => {
    if (analysis.trim() === '') {
      alert('Analysis cannot be empty');
      return;
    }

    if (!caseData || !user) {
      console.error('No case data or user available');
      return;
    }

    const requestBody = {
      case_id: caseData.case_id,
      content: analysis,
      user_id: user.id,
    };

    try {
      const response = await fetch('/api/submit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.statusText} - ${errorText}`);
      }

      alert('Analysis submitted successfully');
      setAnalysis('');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting analysis:', error);
      alert('Error submitting analysis');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="flex justify-between w-full max-w-4xl mb-4">
        <Button variant="outline" className="w-24" onClick={() => router.push('/dashboard')}>
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold">ROAI</h1>
          <p className="text-xl">LSD</p>
        </div>
        <div className="w-24" />
      </div>
      <div className="flex justify-between w-full max-w-4xl">
        <div className="w-1/2 p-4 bg-white rounded shadow">
          {loading ? (
            <p>Loading...</p>
          ) : (
            caseData && (
              <>
                <h2 className="text-2xl font-bold">Case Facts</h2>
                <p className="mt-4">{caseData.case_facts}</p>
              </>
            )
          )}
        </div>
        <div className="w-1/2 p-4 bg-white rounded shadow">
          <h2 className="text-2xl font-bold">Submit Analysis</h2>
          <Textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            className="w-full h-32 mt-4 p-2 border rounded"
            placeholder="Enter your analysis here..."
          />
          <Button className="mt-4" onClick={handleSubmitAnalysis}>
            Submit Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateCase;