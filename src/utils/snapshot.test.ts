import { describe, it, expect } from 'vitest';

// Funktionen für Snapshot-Tests
export function createUserProfile(name: string, age: number, email: string) {
  return {
    id: 'fixed-id-123',
    name,
    age,
    email,
    createdAt: '2025-01-01T00:00:00.000Z',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'de'
    }
  };
}

export function formatTrackData(track: any) {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`,
    genre: track.genre || 'Unknown',
    year: track.year || new Date().getFullYear()
  };
}

describe('Snapshot Tests', () => {
  it('creates consistent user profile', () => {
    const profile = createUserProfile('Max Mustermann', 25, 'max@example.com');
    expect(profile).toMatchSnapshot();
  });

  it('formats track data consistently', () => {
    const track = {
      id: 'track-123',
      title: 'Test Song',
      artist: 'Test Artist',
      duration: 180,
      genre: 'Electronic'
    };
    
    const formatted = formatTrackData(track);
    expect(formatted).toMatchSnapshot();
  });

  it('handles missing track data', () => {
    const track = {
      id: 'track-456',
      title: 'Minimal Track',
      artist: 'Unknown Artist',
      duration: 120
    };
    
    const formatted = formatTrackData(track);
    expect(formatted).toMatchSnapshot();
  });
});
