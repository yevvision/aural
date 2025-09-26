import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FeedPage } from './FeedPage';

// Mock all dependencies
vi.mock('../hooks/useDatabase', () => ({
  useDatabase: () => ({
    tracks: [
      {
        id: 'track-1',
        title: 'Test Track 1',
        artist: 'Test Artist 1',
        duration: 180,
        audioUrl: 'https://example.com/track1.mp3',
        userId: 'user-1',
        user: { id: 'user-1', username: 'testuser1' },
        createdAt: '2025-01-01T00:00:00.000Z',
        likes: 5,
        isLiked: false,
        isBookmarked: false,
        plays: 10,
        commentsCount: 2,
        gender: 'female'
      }
    ],
    isLoading: false,
    toggleLike: vi.fn(),
    toggleBookmark: vi.fn(),
    addCommentToTrack: vi.fn(),
    loadData: vi.fn(),
    forceAddHollaTracks: vi.fn()
  })
}));

vi.mock('../stores/userStore', () => ({
  useUserStore: () => ({
    followedUsers: [],
    myTracks: []
  })
}));

vi.mock('../stores/activityStore', () => ({
  useActivityStore: () => ({
    activities: []
  })
}));

// Mock all UI components
vi.mock('../components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('../components/ui/Typography', () => ({
  Heading: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  Body: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  Caption: ({ children, ...props }: any) => <small {...props}>{children}</small>
}));

vi.mock('../components/ui/Toggle', () => ({
  MultiToggle: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('../components/ui/LiquidGlassHeader', () => ({
  LiquidGlassHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('../components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('../components/ui/LiquidGlassEffect', () => ({
  LiquidGlassEffect: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('../components/ui', () => ({
  StaggerWrapper: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  StaggerItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  RevealOnScroll: ({ children, ...props }: any) => <div {...props}>{children}</div>
}));

vi.mock('../components/feed/AudioCard', () => ({
  AudioCard: ({ track, ...props }: any) => (
    <div data-testid="audio-card" {...props}>
      <h3>{track.title}</h3>
      <p>By {track.user.username}</p>
    </div>
  )
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.addEventListener
const mockAddEventListener = vi.spyOn(window, 'addEventListener');
const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

describe('FeedPage - Simple Tests', () => {
  beforeEach(() => {
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  it('renders the main heading', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Hear desire, live fantasy')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Aural is the platform for erotic audio/)).toBeInTheDocument();
  });

  it('renders gender filter tabs', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Couples')).toBeInTheDocument();
    expect(screen.getByText('Females')).toBeInTheDocument();
    expect(screen.getByText('Males')).toBeInTheDocument();
    expect(screen.getByText('Diverse')).toBeInTheDocument();
  });

  it('renders feed categories', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
    expect(screen.getByText('Most Commented')).toBeInTheDocument();
  });

  it('renders audio cards', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(screen.getAllByTestId('audio-card')).toHaveLength(3); // Multiple cards for different categories
    expect(screen.getAllByText('Test Track 1')).toHaveLength(3); // Multiple instances
    expect(screen.getAllByText('By testuser1')).toHaveLength(3); // Multiple instances
  });

  it('sets up event listeners on mount', () => {
    render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    expect(mockAddEventListener).toHaveBeenCalledWith('trackApproved', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = render(
      <BrowserRouter>
        <FeedPage />
      </BrowserRouter>
    );
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('trackApproved', expect.any(Function));
  });
});
