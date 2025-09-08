import { renderHook, act } from '@testing-library/react';
import { useScrollBlur } from './useScrollBlur';

// Mock window.addEventListener and window.removeEventListener
const mockAddEventListener = vi.spyOn(window, 'addEventListener');
const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

describe('useScrollBlur', () => {
  beforeEach(() => {
    // Reset mocks
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    
    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('should add scroll event listener on mount', () => {
    renderHook(() => useScrollBlur(10));
    
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('should remove scroll event listener on unmount', () => {
    const { unmount } = renderHook(() => useScrollBlur(10));
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should return false when scrollY is less than threshold', () => {
    Object.defineProperty(window, 'scrollY', { value: 5, writable: true });
    
    const { result } = renderHook(() => useScrollBlur(10));
    
    expect(result.current).toBe(false);
  });

  it('should return true when scrollY is greater than threshold', () => {
    Object.defineProperty(window, 'scrollY', { value: 15, writable: true });
    
    const { result } = renderHook(() => useScrollBlur(10));
    
    // Trigger the effect by firing a scroll event
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    
    expect(result.current).toBe(true);
  });

  it('should update when scroll event fires', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    
    const { result } = renderHook(() => useScrollBlur(10));
    
    expect(result.current).toBe(false);
    
    // Simulate scroll event
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 15, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    
    expect(result.current).toBe(true);
  });
});