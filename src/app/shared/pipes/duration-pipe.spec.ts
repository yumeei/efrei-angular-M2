import { DurationPipe } from './duration-pipe';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform seconds to readable format', () => {
    expect(pipe.transform(0)).toBe('0s');
    expect(pipe.transform(30)).toBe('30s');
    expect(pipe.transform(60)).toBe('1m');
    expect(pipe.transform(90)).toBe('1m 30s');
    expect(pipe.transform(3600)).toBe('1h');
    expect(pipe.transform(3661)).toBe('1h 1m 1s');
  });

  it('should handle null and undefined', () => {
    expect(pipe.transform(null)).toBe('0s');
    expect(pipe.transform(undefined)).toBe('0s');
  });

  it('should handle edge cases', () => {
    expect(pipe.transform(0)).toBe('0s');
    expect(pipe.transform(1)).toBe('1s');
    expect(pipe.transform(59)).toBe('59s');
    expect(pipe.transform(61)).toBe('1m 1s');
    expect(pipe.transform(3599)).toBe('59m 59s');
  });
});