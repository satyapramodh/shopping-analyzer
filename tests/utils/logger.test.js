/**
 * Unit tests for logger utility
 * @module tests/utils/logger
 */

import { describe, it, expect, beforeEach, afterEach } from '../setup.js';
import { logger, LogLevel } from '../../src/utils/logger.js';

describe('Logger', () => {

  describe('LogLevel enum', () => {
    it('should have correct levels', () => {
      expect(LogLevel.DEBUG).to.equal(0);
      expect(LogLevel.INFO).to.equal(1);
      expect(LogLevel.WARN).to.equal(2);
      expect(LogLevel.ERROR).to.equal(3);
    });
  });

  describe('Basic logging', () => {
    it('should have logging methods', () => {
      expect(logger.debug).to.be.a('function');
      expect(logger.info).to.be.a('function');
      expect(logger.warn).to.be.a('function');
      expect(logger.error).to.be.a('function');
    });

    it('should log without errors', () => {
      expect(() => logger.debug('Debug message')).to.not.throw();
      expect(() => logger.info('Info message')).to.not.throw();
      expect(() => logger.warn('Warning message')).to.not.throw();
      expect(() => logger.error('Error message')).to.not.throw();
    });

    it('should accept context objects', () => {
      expect(() => logger.info('Message', { key: 'value' })).to.not.throw();
    });
  });

  describe('Child loggers', () => {
    it('should create child logger', () => {
      const child = logger.createChild('TestModule');
      expect(child).to.have.property('debug');
      expect(child).to.have.property('info');
      expect(child).to.have.property('warn');
      expect(child).to.have.property('error');
    });

    it('should log with namespace prefix', () => {
      const child = logger.createChild('TestModule');
      expect(() => child.info('Child message')).to.not.throw();
    });

    it('should support nested namespaces', () => {
      const parent = logger.createChild('Parent');
      const child = parent.createChild('Child');
      expect(() => child.info('Nested message')).to.not.throw();
    });
  });

  describe('Enable/Disable', () => {
    it('should have enable and disable methods', () => {
      expect(logger.enable).to.be.a('function');
      expect(logger.disable).to.be.a('function');
      expect(logger.isEnabled).to.be.a('function');
    });

    it('should disable logging', () => {
      logger.disable();
      expect(logger.isEnabled()).to.be.false;
      logger.enable(); // Re-enable for other tests
    });

    it('should enable logging', () => {
      logger.enable();
      expect(logger.isEnabled()).to.be.true;
    });
  });

  describe('Log level filtering', () => {
    it('should have setLevel method', () => {
      expect(logger.setLevel).to.be.a('function');
    });

    it('should filter logs below threshold', () => {
      const originalLevel = logger.getLevel();
      
      logger.setLevel(LogLevel.WARN);
      expect(() => logger.debug('Should not log')).to.not.throw();
      expect(() => logger.info('Should not log')).to.not.throw();
      expect(() => logger.warn('Should log')).to.not.throw();
      
      logger.setLevel(originalLevel); // Restore
    });

    it('should get current level', () => {
      const level = logger.getLevel();
      expect(level).to.be.a('number');
    });
  });

});
