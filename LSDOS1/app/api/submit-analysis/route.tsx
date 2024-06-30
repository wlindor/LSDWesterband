import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@clerk/clerk-sdk-node'; // Adjust the import if necessary for Clerk

export async function POST(req: NextRequest) {
  try {
    const { case_id, content, user_id } = await req.json();
    if (!case_id || !content || !user_id) {
      console.error('Missing case_id, content, or user_id');
      return NextResponse.json({ error: 'Missing case_id, content, or user_id' }, { status: 400 });
    }

    console.log('Received data:', { case_id, content, user_id });

    const response = await fetch('http://localhost:8080/api/submit-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ case_id, content, user_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    console.log('Backend response received');

    console.log('Firestore updated successfully');
    return NextResponse.json({ message: 'Analysis submitted successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error submitting analysis:', error.message, error.stack);
    } else {
      console.error('Unknown error submitting analysis:', error);
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
