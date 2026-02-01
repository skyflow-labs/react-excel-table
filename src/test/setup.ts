import '@testing-library/jest-dom';

// Mock canvas for text measurement
class MockCanvasRenderingContext2D {
  font = '';
  measureText(text: string) {
    return { width: text.length * 8 };
  }
}

// @ts-expect-error - Mock implementation for testing
HTMLCanvasElement.prototype.getContext = function (
  contextId: string
): CanvasRenderingContext2D | null {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D() as unknown as CanvasRenderingContext2D;
  }
  return null;
};

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = ((callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
}) as typeof requestAnimationFrame;

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};
