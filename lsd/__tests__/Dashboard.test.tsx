import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../app/dashboard/page';
import { AuthProvider } from '../app/AuthContext';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the @clerk/nextjs module
jest.mock('@clerk/nextjs', () => ({
  useClerk: () => ({
    signOut: jest.fn(),
  }),
}));

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ billableHours: 100, cases: ['Case 1', 'Case 2'] }),
  })
) as jest.Mock;

describe('Dashboard', () => {
  beforeEach(() => {
    render(
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    );
  });

  it('renders the dashboard title', () => {
    expect(screen.getByText('ROAI LSD')).toBeInTheDocument();
  });

  it('displays the logout button', () => {
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('shows the File Cabinet section', () => {
    expect(screen.getByText('File Cabinet')).toBeInTheDocument();
  });

  it('displays the Token Bank card', () => {
    expect(screen.getByText('Token Bank')).toBeInTheDocument();
    expect(screen.getByText('0 ROAI')).toBeInTheDocument();
  });

  it('shows the Career Progress card', () => {
    expect(screen.getByText('Career Progress')).toBeInTheDocument();
    expect(screen.getByText('Intern')).toBeInTheDocument();
  });

  it('displays the Judge Cases card', () => {
    expect(screen.getByText('Judge Cases')).toBeInTheDocument();
    expect(screen.getByText('Start Judging')).toBeInTheDocument();
  });

  it('shows the Litigate card', () => {
    expect(screen.getByText('Litigate')).toBeInTheDocument();
    expect(screen.getByText('Choose Side')).toBeInTheDocument();
  });

  it('displays the Grade as Professor card', () => {
    expect(screen.getByText('Grade as Professor')).toBeInTheDocument();
    expect(screen.getByText('Start Grading')).toBeInTheDocument();
  });

  it('fetches and displays user data', async () => {
    await waitFor(() => {
      expect(screen.getByText('100 / 2000')).toBeInTheDocument();
      expect(screen.getByText('Case 1')).toBeInTheDocument();
      expect(screen.getByText('Case 2')).toBeInTheDocument();
    });
  });

  it('handles the Start Case button click', async () => {
    const startCaseButton = screen.getByText('Start Case');
    fireEvent.click(startCaseButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-case', expect.any(Object));
    });
  });
});