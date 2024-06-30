// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn()
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null)
    };
  },
}));

// Suppress console.error in tests
console.error = jest.fn();

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});