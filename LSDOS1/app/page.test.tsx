import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the AuthContext
jest.mock('./AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the Clerk SignInButton component
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });
  });

  it('renders the title and subtitle', () => {
    render(<HomePage />);
    expect(screen.getByText('ROAI LLP')).toBeInTheDocument();
    expect(screen.getByText('Legal Simulation Department')).toBeInTheDocument();
  });

  it('renders the Start button', () => {
    render(<HomePage />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('displays loading state when isLoading is true', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });
    render(<HomePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123' },
      isLoading: false,
    });
    render(<HomePage />);
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });
});