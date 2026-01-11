/**
 * Unit tests for error classes
 * @module tests/utils/errors
 */

import { describe, it, expect } from '../setup.js';
import { 
  AppError, 
  APIError, 
  NetworkError, 
  DataValidationError,
  DataNotFoundError,
  ConfigurationError,
  ChartError,
  StateError
} from '../../src/utils/errors.js';

describe('Error Classes', () => {

  describe('AppError', () => {
    it('should create error with message', () => {
      const error = new AppError('Test error');
      expect(error.message).to.equal('Test error');
      expect(error.name).to.equal('AppError');
    });

    it('should store context', () => {
      const context = { userId: 123 };
      const error = new AppError('Error', context);
      expect(error.context).to.deep.equal(context);
    });

    it('should have timestamp', () => {
      const error = new AppError('Error');
      expect(error.timestamp).to.be.a('string');
      expect(new Date(error.timestamp).getTime()).to.be.closeTo(Date.now(), 1000);
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test', { key: 'value' });
      const json = error.toJSON();
      
      expect(json.name).to.equal('AppError');
      expect(json.message).to.equal('Test');
      expect(json.context).to.deep.equal({ key: 'value' });
      expect(json.timestamp).to.be.a('string');
    });
  });

  describe('APIError', () => {
    it('should extend AppError', () => {
      const error = new APIError('API failed', 500);
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('APIError');
    });

    it('should store status code', () => {
      const error = new APIError('Not found', 404);
      expect(error.statusCode).to.equal(404);
    });

    it('should include status code in JSON', () => {
      const error = new APIError('Server error', 500);
      const json = error.toJSON();
      expect(json.statusCode).to.equal(500);
    });
  });

  describe('NetworkError', () => {
    it('should extend AppError', () => {
      const error = new NetworkError('Connection failed');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('NetworkError');
    });

    it('should work without context', () => {
      const error = new NetworkError('Timeout');
      expect(error.message).to.equal('Timeout');
      expect(error.context).to.be.undefined;
    });
  });

  describe('DataValidationError', () => {
    it('should extend AppError', () => {
      const error = new DataValidationError('Invalid data');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('DataValidationError');
    });

    it('should store validation context', () => {
      const error = new DataValidationError('Invalid email', { email: 'bad@' });
      expect(error.context.email).to.equal('bad@');
    });
  });

  describe('DataNotFoundError', () => {
    it('should extend AppError', () => {
      const error = new DataNotFoundError('User not found');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('DataNotFoundError');
    });
  });

  describe('ConfigurationError', () => {
    it('should extend AppError', () => {
      const error = new ConfigurationError('Missing config');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('ConfigurationError');
    });
  });

  describe('ChartError', () => {
    it('should extend AppError', () => {
      const error = new ChartError('Chart render failed');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('ChartError');
    });
  });

  describe('StateError', () => {
    it('should extend AppError', () => {
      const error = new StateError('Invalid state transition');
      expect(error).to.be.instanceOf(AppError);
      expect(error.name).to.equal('StateError');
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper prototype chain', () => {
      const error = new APIError('Test', 500);
      expect(error instanceof AppError).to.be.true;
      expect(error instanceof Error).to.be.true;
    });

    it('should have correct constructor', () => {
      const error = new DataValidationError('Test');
      expect(error.constructor.name).to.equal('DataValidationError');
    });
  });

});
