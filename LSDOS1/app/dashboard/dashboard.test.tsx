import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from './page';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { useClerk } from '@clerk/nextjs';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the AuthContext
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the Clerk hook
jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

// Mock fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ billableHours: 1000, cases: ['Case 1', 'Case 2'] }),
  })
) as jest.Mock;

describe('Dashboard', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123' },
    });
    (useClerk as jest.Mock).mockReturnValue({
      signOut: jest.fn(),
    });
  });

  it('renders the dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('ROAI')).toBeInTheDocument();
    expect(screen.getByText('LSD')).toBeInTheDocument();
  });

  it('displays the number of cases', async () => {
    render(<Dashboard />);
    const casesCount = await screen.findByText('2');
    expect(casesCount).toBeInTheDocument();
  });

  it('displays the billable hours progress', async () => {
    render(<Dashboard />);
    const progressText = await screen.findByText('1000 / 2000');
    expect(progressText).toBeInTheDocument();
  });

  it('handles sign out', async () => {
    const signOutMock = jest.fn();
    (useClerk as jest.Mock).mockReturnValue({
      signOut: signOutMock,
    });
    render(<Dashboard />);
    const logOutButton = screen.getByText('Log Out');
    fireEvent.click(logOutButton);
    expect(signOutMock).toHaveBeenCalled();
  });

  it('handles case generation', async () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
    render(<Dashboard />);
    const startCaseButton = screen.getByText('Start Case');
    fireEvent.click(startCaseButton);
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/generate-case?caseData='));
  });
});