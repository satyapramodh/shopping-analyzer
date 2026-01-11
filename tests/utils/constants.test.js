/**
 * Unit tests for constants
 * @module tests/utils/constants
 */

import { describe, it, expect } from '../setup.js';
import { CONSTANTS } from '../../src/utils/constants.js';

describe('Constants', () => {

  describe('API constants', () => {
    it('should have GraphQL endpoint', () => {
      expect(CONSTANTS.API.GRAPHQL_ENDPOINT).to.be.a('string');
      expect(CONSTANTS.API.GRAPHQL_ENDPOINT).to.include('graphql');
    });

    it('should have HTTP methods', () => {
      expect(CONSTANTS.API.METHOD.POST).to.equal('POST');
      expect(CONSTANTS.API.METHOD.GET).to.equal('GET');
    });

    it('should have HTTP status codes', () => {
      expect(CONSTANTS.API.STATUS.OK).to.equal(200);
      expect(CONSTANTS.API.STATUS.UNAUTHORIZED).to.equal(401);
      expect(CONSTANTS.API.STATUS.NOT_FOUND).to.equal(404);
      expect(CONSTANTS.API.STATUS.SERVER_ERROR).to.equal(500);
    });

    it('should have headers', () => {
      expect(CONSTANTS.API.HEADERS.CONTENT_TYPE).to.equal('Content-Type');
      expect(CONSTANTS.API.HEADERS.JSON).to.equal('application/json');
    });
  });

  describe('Business logic constants', () => {
    it('should have rewards configuration', () => {
      expect(CONSTANTS.BUSINESS.REWARDS_RATE).to.equal(0.02);
      expect(CONSTANTS.BUSINESS.MAX_REWARD).to.equal(1000);
    });

    it('should have transaction types', () => {
      expect(CONSTANTS.BUSINESS.TRANSACTION_TYPE.WAREHOUSE).to.equal('warehouse');
      expect(CONSTANTS.BUSINESS.TRANSACTION_TYPE.ONLINE).to.equal('online');
      expect(CONSTANTS.BUSINESS.TRANSACTION_TYPE.GAS).to.equal('gas');
    });

    it('should have refund types', () => {
      expect(CONSTANTS.BUSINESS.REFUND_TYPE.FULL_RETURN).to.be.a('string');
      expect(CONSTANTS.BUSINESS.REFUND_TYPE.PRICE_ADJUSTMENT).to.be.a('string');
    });
  });

  describe('UI constants', () => {
    it('should have default page size', () => {
      expect(CONSTANTS.UI.DEFAULT_PAGE_SIZE).to.be.a('number');
      expect(CONSTANTS.UI.DEFAULT_PAGE_SIZE).to.be.greaterThan(0);
    });

    it('should have date format', () => {
      expect(CONSTANTS.UI.DATE_FORMAT).to.be.a('string');
    });

    it('should have loading messages', () => {
      expect(CONSTANTS.UI.LOADING_MESSAGE).to.be.a('string');
      expect(CONSTANTS.UI.ERROR_MESSAGE).to.be.a('string');
    });
  });

  describe('Format constants', () => {
    it('should have locale', () => {
      expect(CONSTANTS.FORMATS.LOCALE).to.equal('en-US');
    });

    it('should have currency', () => {
      expect(CONSTANTS.FORMATS.CURRENCY).to.equal('USD');
    });
  });

  describe('Chart constants', () => {
    it('should have default colors', () => {
      expect(CONSTANTS.CHART.COLORS).to.be.an('array');
      expect(CONSTANTS.CHART.COLORS.length).to.be.greaterThan(0);
    });

    it('should have chart types', () => {
      expect(CONSTANTS.CHART.TYPE.BAR).to.equal('bar');
      expect(CONSTANTS.CHART.TYPE.LINE).to.equal('line');
      expect(CONSTANTS.CHART.TYPE.PIE).to.equal('pie');
    });
  });

  describe('Storage constants', () => {
    it('should have storage keys', () => {
      expect(CONSTANTS.STORAGE.PREFIX).to.be.a('string');
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of top-level constants', () => {
      expect(() => {
        CONSTANTS.NEW_KEY = 'value';
      }).to.throw();
    });

    it('should not allow modification of nested constants', () => {
      expect(() => {
        CONSTANTS.API.NEW_KEY = 'value';
      }).to.throw();
    });
  });

});
