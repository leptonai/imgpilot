import { cn, blobToBase64, getRandomDifferent } from './utils';

// Mock FileReader for testing
class MockFileReader {
  onloadend: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL(blob: Blob) {
    // Simulate reading the blob and converting to data URL
    const type = (blob as any)._type || 'application/octet-stream';
    const text = (blob as any)._data || '';
    this.result = `data:${type};base64,${btoa(text)}`;

    if (this.onloadend) {
      this.onloadend();
    }
  }
}

describe('utils', () => {
  beforeAll(() => {
    // Mock the FileReader globally
    (global as any).FileReader = MockFileReader;
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should merge and override Tailwind classes correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle conditional classes', () => {
      const condition = true;
      expect(cn('base-class', condition && 'conditional-class')).toBe('base-class conditional-class');
    });

    it('should handle null and undefined values', () => {
      expect(cn('class1', null, 'class2', undefined)).toBe('class1 class2');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
    });
  });

  describe('blobToBase64', () => {
    it('should convert a blob to base64 string', async () => {
      const text = 'Hello, World!';
      // Create a mock blob with necessary properties
      const mockBlob = { _data: text, _type: 'text/plain' } as any as Blob;

      const base64String = await blobToBase64(mockBlob);

      expect(base64String).toMatch(/^data:text\/plain;base64,/);
      expect(base64String).toContain(btoa(text));
    });

    it('should work with different blob types', async () => {
      const data = JSON.stringify({ test: 'data' });
      // Create a mock blob with necessary properties
      const mockBlob = { _data: data, _type: 'application/json' } as any as Blob;

      const base64String = await blobToBase64(mockBlob);

      expect(base64String).toMatch(/^data:application\/json;base64,/);
      expect(base64String).toContain(btoa(data));
    });
  });

  describe('getRandomDifferent', () => {
    it('should return different item from array when possible', () => {
      const arr = ['a', 'b', 'c'];
      const lastItem = 'a';

      const result = getRandomDifferent(arr, lastItem);

      expect(arr).toContain(result);
      expect(result).not.toBe(lastItem);
    });

    it('should return the only available item when array has one element', () => {
      const arr = ['only'];
      const lastItem = null;

      const result = getRandomDifferent(arr, lastItem);

      expect(result).toBe('only');
    });

    it('should return item different from lastItem when array has multiple items', () => {
      const arr = ['a', 'b'];
      const lastItem = 'a';

      const result = getRandomDifferent(arr, lastItem);

      expect(result).toBe('b');
    });

    it('should handle arrays with more than two items', () => {
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const lastItem = 'c';

      const result = getRandomDifferent(arr, lastItem);

      expect(arr).toContain(result);
      expect(result).not.toBe(lastItem);
    });

    it('should handle when lastItem is not in the array', () => {
      const arr = ['a', 'b', 'c'];
      const lastItem = 'z';

      const result = getRandomDifferent(arr, lastItem);

      expect(arr).toContain(result);
    });
  });
});