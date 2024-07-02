"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import Slider from 'react-slider'; // Assuming 'react-slider' is the correct package for the Slider component.

const GradeCase = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<{ caseID: number; argument: string }[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<{ caseID: number; argument: string } | null>(null);
  const [score, setScore] = useState(50);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Fetch submissions to grade
    // This is a placeholder, you'll need to implement the actual API call
    // const fetchSubmissions = async () => {
    //   const response = await fetch('/api/submissions-to-grade');
    //   const data = await response.json();
    //   setSubmissions(data);
    // };
    // fetchSubmissions();
  }, []);

  const handleSubmitGrade = async () => {
    // This is a placeholder, you'll need to implement the actual API call
    // const response = await fetch('/api/grade-submission', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ submissionID: selectedSubmission.id, graderID: user.id, score, feedback }),
    // });
    // Handle the response...
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8">Grade Cases</h1>
      {selectedSubmission ? (
        <Card>
          <CardHeader>
            <CardTitle>Grade Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{selectedSubmission.argument}</p>
            <h3 className="text-xl font-semibold mb-2">Score</h3>
            <Slider
              value={score}
              onChange={(value: number) => setScore(value)}
              min={0}
              max={100}
              step={1}
              className="mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">Feedback</h3>
            <Textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              className="mb-4"
            />
            <Button onClick={handleSubmitGrade}>Submit Grade</Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Select a submission to grade:</h2>
          {submissions.map((submission, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle>Submission for Case {submission.caseID}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setSelectedSubmission(submission)}>Grade this submission</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeCase;