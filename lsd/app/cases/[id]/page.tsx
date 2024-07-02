"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/use-toast';

const CaseDetail = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<null | any>(null);
  const [argument, setArgument] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchCaseData = async () => {
      if (!user || !params.id) return;

      try {
        const response = await fetch(`/api/cases/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch case data');
        const data = await response.json();
        setCaseData(data);
        setArgument(data.argument || '');
      } catch (error) {
        console.error('Error fetching case data:', error);
        addToast({
          title: "Error",
          description: "Failed to load case data. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchCaseData();
  }, [user, params.id, addToast]);

  const handleSaveDraft = async () => {
    try {
      const response = await fetch(`/api/cases/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ argument, status: 'draft' }),
      });
      if (!response.ok) throw new Error('Failed to save draft');
      addToast({
        title: "Success",
        description: "Draft saved successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      addToast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/cases/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ argument }),
      });
      if (!response.ok) throw new Error('Failed to submit case');
      addToast({
        title: "Success",
        description: "Case submitted successfully. You've earned 50 billable hours!",
        variant: "success",
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting case:', error);
      addToast({
        title: "Error",
        description: "Failed to submit case. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{caseData.caseName}</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Case Facts</h2>
          <p className="mb-4">{caseData.caseFacts}</p>
          
          <h2 className="text-xl font-semibold mb-2">Your Argument</h2>
          <Textarea 
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder="Enter your legal argument here..."
            className="mb-4"
            rows={10}
          />
          
          <div className="flex justify-between">
            <Button onClick={handleSaveDraft}>Save Draft</Button>
            <Button onClick={handleSubmit}>Submit Case</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaseDetail;
