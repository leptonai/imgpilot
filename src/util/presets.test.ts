import { predefineState, paintingTypes, artStyles, presets } from './presets';

describe('presets', () => {
  describe('predefineState', () => {
    it('should have the correct structure', () => {
      expect(predefineState).toBeDefined();
      expect(predefineState).toHaveProperty('activeTool');
      expect(predefineState).toHaveProperty('openMenu');
      
      expect(predefineState.activeTool).toEqual({
        type: "freedraw",
        customType: null,
        locked: false,
        lastActiveTool: null,
      });
      
      expect(predefineState.openMenu).toBe('shape');
    });
    
    it('should be a partial AppState', () => {
      // Just check that it has the required properties
      const { activeTool, openMenu } = predefineState;
      expect(activeTool).toBeDefined();
      expect(openMenu).toBeDefined();
    });
  });

  describe('paintingTypes', () => {
    it('should be an array of painting type strings', () => {
      expect(paintingTypes).toBeInstanceOf(Array);
      expect(paintingTypes.length).toBeGreaterThan(0);
      
      paintingTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should contain expected painting types', () => {
      expect(paintingTypes).toContain('oil painting');
      expect(paintingTypes).toContain('watercolor painting');
      expect(paintingTypes).toContain('acrylic painting');
      expect(paintingTypes).toContain('drawing');
      expect(paintingTypes).toContain('printmaking');
    });
    
    it('should have exactly 5 painting types', () => {
      expect(paintingTypes.length).toBe(5);
    });
  });

  describe('artStyles', () => {
    it('should be an array of art style strings', () => {
      expect(artStyles).toBeInstanceOf(Array);
      expect(artStyles.length).toBeGreaterThan(0);
      
      artStyles.forEach(style => {
        expect(typeof style).toBe('string');
      });
    });

    it('should contain expected art styles', () => {
      expect(artStyles).toContain('realism');
      expect(artStyles).toContain('impressionism');
      expect(artStyles).toContain('expressionism');
      expect(artStyles).toContain('cubism');
      expect(artStyles).toContain('abstract art');
      expect(artStyles).toContain('surrealism');
      expect(artStyles).toContain('baroque');
      expect(artStyles).toContain('rococo');
      expect(artStyles).toContain('fauvism');
    });
    
    it('should have exactly 9 art styles', () => {
      expect(artStyles.length).toBe(9);
    });
  });

  describe('presets', () => {
    it('should be an array of preset objects', () => {
      expect(presets).toBeInstanceOf(Array);
      expect(presets.length).toBeGreaterThan(0);
      
      presets.forEach(preset => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('prompt');
        expect(preset).toHaveProperty('elements');
        expect(preset).toHaveProperty('base64');
        
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.prompt).toBe('string');
        expect(Array.isArray(preset.elements)).toBe(true);
        expect(typeof preset.base64).toBe('string');
        expect(preset.base64).toMatch(/^data:image\/jpeg;base64,/);
      });
    });

    it('should have the expected preset names', () => {
      const presetNames = presets.map(p => p.name);
      expect(presetNames).toContain('Christmas tree');
      expect(presetNames).toContain('Santa Claus');
      expect(presetNames).toContain('Kung Fu Panda');
      expect(presetNames).toContain('Polar Bear');
    });

    it('should have expected prompt structure', () => {
      presets.forEach(preset => {
        expect(typeof preset.prompt).toBe('string');
        expect(preset.prompt.length).toBeGreaterThan(0);
      });
    });

    it('should have elements array with proper structure', () => {
      presets.forEach(preset => {
        expect(Array.isArray(preset.elements)).toBe(true);
        // Check that elements array has valid ExcalidrawElement objects
        preset.elements.forEach(element => {
          expect(element).toHaveProperty('type');
          expect(typeof element.type).toBe('string');
        });
      });
    });

    it('should have valid base64 strings', () => {
      presets.forEach(preset => {
        expect(typeof preset.base64).toBe('string');
        expect(preset.base64).toMatch(/^data:image\/jpeg;base64,/);
      });
    });

    it('should have non-empty elements arrays', () => {
      presets.forEach(preset => {
        expect(preset.elements.length).toBeGreaterThan(0);
      });
    });
    
    it('should have different names', () => {
      const names = presets.map(p => p.name);
      const uniqueNames = Array.from(new Set(names));
      expect(names.length).toBe(uniqueNames.length);
    });
  });
});