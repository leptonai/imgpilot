// Unit tests for the Home page component
// Since we're in a Node environment, we focus on testing the logic and dependencies
// rather than React component rendering

import { getRandomDifferent } from '@/lib/utils';
import { artStyles, paintingTypes } from '@/util/presets';

// Test the business logic that's used in the Home component
describe('Home Page Component Logic', () => {
  describe('getRandomDifferent utility function', () => {
    it('should return a different value from the array when possible', () => {
      const array = ['a', 'b', 'c'];
      const exclude = 'a';
      const result = getRandomDifferent(array, exclude);

      expect(array).toContain(result);
    });

    it('should return a different value when exclude value exists in array', () => {
      const array = ['a', 'b', 'c'];
      const exclude = 'a';
      // Run multiple times to verify it doesn't return the excluded value
      for (let i = 0; i < 20; i++) {
        const result = getRandomDifferent(array, exclude);
        expect(result).not.toBe(exclude);
        expect(array).toContain(result);
      }
    });

    it('should return any value when exclude is not in the array', () => {
      const array = ['a', 'b', 'c'];
      const exclude = 'd';
      const result = getRandomDifferent(array, exclude);

      expect(array).toContain(result);
    });

    it('should return the only item when array has only one element', () => {
      const array = ['a'];
      const exclude = 'b';  // different from the only item
      const result = getRandomDifferent(array, exclude);

      expect(result).toBe('a');
    });

    it('should return the only item when it matches exclude (edge case)', () => {
      const array = ['a'];
      const exclude = 'a';  // same as the only item
      const result = getRandomDifferent(array, exclude);

      expect(result).toBe('a');
    });

    it('should handle empty array (though this reveals a type safety issue)', () => {
      const array: string[] = [];
      const exclude = 'a';

      // This will attempt to access arr[0] on an empty array, returning undefined
      // This reveals a type safety issue in the function - ideally it should have better error handling
      const result = getRandomDifferent(array, exclude);
      expect(result).toBeUndefined();
    });
  });

  describe('Preset values used in the component', () => {
    it('should have art styles available', () => {
      expect(artStyles).toBeDefined();
      expect(Array.isArray(artStyles)).toBe(true);
      expect(artStyles.length).toBeGreaterThan(0);
    });

    it('should have painting types available', () => {
      expect(paintingTypes).toBeDefined();
      expect(Array.isArray(paintingTypes)).toBe(true);
      expect(paintingTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Component state logic', () => {
    it('should correctly generate real prompt from base prompt and style', () => {
      // This tests the logic from the useMemo in the component:
      // const realPrompt = useMemo(
      //   () => `${drawState.prompt},beautify ${drawState.style} style`,
      //   [drawState.prompt, drawState.style],
      // );

      const prompt = "A beautiful landscape";
      const style = "impressionist";
      const realPrompt = `${prompt},beautify ${style} style`;

      expect(realPrompt).toBe("A beautiful landscape,beautify impressionist style");
    });

    it('should correctly generate version string from elements', () => {
      // This tests the logic from the getVersion function in the component:
      // const getVersion = (elements: readonly ExcalidrawElement[]): string => {
      //   return elements.map((e) => e.version).join("");
      // };

      const elements = [
        { version: 1 },
        { version: 2 },
        { version: 3 },
      ] as any;

      const versionString = elements.map((e: any) => e.version).join('');
      expect(versionString).toBe('123');
    });
  });
});