/**
 * Unit tests for FilterService
 * @module tests/services/FilterService
 */

import { describe, it, expect } from '../setup.js';
import { 
  FilterService, 
  YearFilter, 
  LocationFilter, 
  DateRangeFilter,
  FilterPipeline 
} from '../../src/services/FilterService.js';

describe('FilterService', () => {

  describe('YearFilter', () => {
    it('should filter by year', () => {
      const filter = new YearFilter(2024);
      const data = [
        { date: '2024-01-15' },
        { date: '2023-12-31' },
        { date: '2024-06-30' }
      ];

      const result = data.filter(item => filter.apply(item));
      expect(result).to.have.lengthOf(2);
      expect(result[0].date).to.include('2024');
    });

    it('should handle Date objects', () => {
      const filter = new YearFilter(2024);
      const item = { date: new Date('2024-01-15') };
      expect(filter.apply(item)).to.be.true;
    });
  });

  describe('LocationFilter', () => {
    it('should filter by location', () => {
      const filter = new LocationFilter('123');
      const data = [
        { location: '123' },
        { location: '456' },
        { location: '123' }
      ];

      const result = data.filter(item => filter.apply(item));
      expect(result).to.have.lengthOf(2);
    });

    it('should normalize location formats', () => {
      const filter = new LocationFilter('123');
      expect(filter.apply({ location: 'Warehouse 123' })).to.be.true;
      expect(filter.apply({ location: '123' })).to.be.true;
      expect(filter.apply({ location: '456' })).to.be.false;
    });
  });

  describe('DateRangeFilter', () => {
    it('should filter by date range', () => {
      const filter = new DateRangeFilter('2024-01-01', '2024-12-31');
      const data = [
        { date: '2024-06-15' },
        { date: '2023-12-31' },
        { date: '2025-01-01' }
      ];

      const result = data.filter(item => filter.apply(item));
      expect(result).to.have.lengthOf(1);
      expect(result[0].date).to.equal('2024-06-15');
    });

    it('should handle Date objects', () => {
      const filter = new DateRangeFilter(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );
      
      expect(filter.apply({ date: new Date('2024-06-15') })).to.be.true;
      expect(filter.apply({ date: new Date('2025-01-01') })).to.be.false;
    });

    it('should handle inclusive boundaries', () => {
      const filter = new DateRangeFilter('2024-01-01', '2024-01-31');
      expect(filter.apply({ date: '2024-01-01' })).to.be.true;
      expect(filter.apply({ date: '2024-01-31' })).to.be.true;
    });
  });

  describe('FilterPipeline', () => {
    it('should combine multiple filters with AND logic', () => {
      const pipeline = new FilterPipeline();
      pipeline.addFilter(new YearFilter(2024));
      pipeline.addFilter(new LocationFilter('123'));

      const data = [
        { date: '2024-01-15', location: '123' }, // Match
        { date: '2024-01-15', location: '456' }, // No match
        { date: '2023-01-15', location: '123' }  // No match
      ];

      const result = pipeline.apply(data);
      expect(result).to.have.lengthOf(1);
      expect(result[0].location).to.equal('123');
    });

    it('should handle empty filter pipeline', () => {
      const pipeline = new FilterPipeline();
      const data = [{ value: 1 }, { value: 2 }];
      
      const result = pipeline.apply(data);
      expect(result).to.have.lengthOf(2); // All pass
    });

    it('should support filter removal', () => {
      const pipeline = new FilterPipeline();
      const filter = new YearFilter(2024);
      
      pipeline.addFilter(filter);
      expect(pipeline.filters).to.have.lengthOf(1);
      
      pipeline.removeFilter(filter);
      expect(pipeline.filters).to.have.lengthOf(0);
    });

    it('should support pipeline clearing', () => {
      const pipeline = new FilterPipeline();
      pipeline.addFilter(new YearFilter(2024));
      pipeline.addFilter(new LocationFilter('123'));
      
      pipeline.clear();
      expect(pipeline.filters).to.have.lengthOf(0);
    });
  });

  describe('FilterService integration', () => {
    let service;

    beforeEach(() => {
      service = new FilterService();
    });

    it('should create filter pipeline', () => {
      const pipeline = service.createPipeline();
      expect(pipeline).to.be.instanceOf(FilterPipeline);
    });

    it('should register custom filters', () => {
      class CustomFilter {
        apply(item) {
          return item.custom === true;
        }
      }

      service.registerFilter('custom', CustomFilter);
      const filter = service.createFilter('custom');
      
      expect(filter).to.be.instanceOf(CustomFilter);
    });
  });

});
