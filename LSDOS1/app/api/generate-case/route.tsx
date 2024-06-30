import { NextRequest, NextResponse } from 'next/server';
//import { verifyToken } from '@clerk/clerk-sdk-node'; // Adjust the import if necessary for Clerk

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      console.error('Missing user_id');
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    console.log('Received data:', { user_id });

    const response = await fetch('http://localhost:8080/api/generate-case', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response received:', data);

    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error generating case:', error.message, error.stack);
    } else {
      console.error('Unknown error generating case:', error);
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
