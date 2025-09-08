import { render, screen, act } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import * as playerStore from '../../stores/playerStore';
import * as useGlobalAudioManager from '../../hooks/useGlobalAudioManager';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the stores and hooks
vi.mock('../../stores/playerStore', () => ({
  usePlayerStore: () => ({
    currentTrack: null
  })
}));

vi.mock('../../hooks/useGlobalAudioManager', () => ({
  initializeGlobalAudioManager: vi.fn(),
  useGlobalAudioManager: vi.fn()
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Mock window.addEventListener and window.removeEventListener
const mockAddEventListener = vi.spyOn(window, 'addEventListener');
const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

describe('AppLayout', () => {
  beforeEach(() => {
    // Reset mocks
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('applies content-blur class when scrolled', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    );
    
    const mainElement = screen.getByRole('main');
    
    // Initially should not have the blur class
    expect(mainElement).not.toHaveClass('content-blur');
    
    // Simulate scroll event
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 15, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    
    // Should now have the blur class
    expect(mainElement).toHaveClass('content-blur');
  });

  it('does not apply content-blur class when not scrolled', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppLayout />
      </MemoryRouter>
    );
    
    const mainElement = screen.getByRole('main');
    
    // Should not have the blur class
    expect(mainElement).not.toHaveClass('content-blur');
  });
});