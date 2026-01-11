/**
 * Unit tests for StateManager
 * @module tests/core/StateManager
 */

import { describe, it, expect, beforeEach, afterEach } from '../setup.js';
import { StateManager } from '../../src/core/StateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  afterEach(() => {
    stateManager.clear();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      stateManager.set('testKey', 'testValue');
      expect(stateManager.get('testKey')).to.equal('testValue');
    });

    it('should return undefined for missing keys', () => {
      expect(stateManager.get('nonexistent')).to.be.undefined;
    });

    it('should return default value for missing keys', () => {
      expect(stateManager.get('nonexistent', 'default')).to.equal('default');
    });

    it('should store complex objects', () => {
      const obj = { nested: { value: 42 } };
      stateManager.set('complex', obj);
      expect(stateManager.get('complex')).to.deep.equal(obj);
    });
  });

  describe('update', () => {
    it('should merge objects', () => {
      stateManager.set('user', { name: 'John', age: 30 });
      stateManager.update('user', { age: 31 });
      
      const result = stateManager.get('user');
      expect(result.name).to.equal('John');
      expect(result.age).to.equal(31);
    });

    it('should create key if not exists', () => {
      stateManager.update('newKey', { value: 123 });
      expect(stateManager.get('newKey')).to.deep.equal({ value: 123 });
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on changes', (done) => {
      const key = 'testKey';
      
      stateManager.subscribe(key, (newValue, oldValue) => {
        expect(newValue).to.equal('newValue');
        expect(oldValue).to.be.undefined;
        done();
      });

      stateManager.set(key, 'newValue');
    });

    it('should support multiple subscribers', () => {
      let called1 = false;
      let called2 = false;

      stateManager.subscribe('key', () => { called1 = true; });
      stateManager.subscribe('key', () => { called2 = true; });

      stateManager.set('key', 'value');

      expect(called1).to.be.true;
      expect(called2).to.be.true;
    });

    it('should provide old and new values', (done) => {
      stateManager.set('key', 'oldValue');

      stateManager.subscribe('key', (newValue, oldValue) => {
        expect(oldValue).to.equal('oldValue');
        expect(newValue).to.equal('newValue');
        done();
      });

      stateManager.set('key', 'newValue');
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription', () => {
      let called = false;
      
      const id = stateManager.subscribe('key', () => {
        called = true;
      });

      stateManager.unsubscribe('key', id);
      stateManager.set('key', 'value');

      expect(called).to.be.false;
    });
  });

  describe('subscribeAll', () => {
    it('should notify on any state change', (done) => {
      stateManager.subscribeAll((key, newValue) => {
        expect(key).to.equal('anyKey');
        expect(newValue).to.equal('anyValue');
        done();
      });

      stateManager.set('anyKey', 'anyValue');
    });
  });

  describe('has', () => {
    it('should check key existence', () => {
      stateManager.set('exists', 'value');
      
      expect(stateManager.has('exists')).to.be.true;
      expect(stateManager.has('missing')).to.be.false;
    });
  });

  describe('delete', () => {
    it('should remove key', () => {
      stateManager.set('key', 'value');
      stateManager.delete('key');
      
      expect(stateManager.has('key')).to.be.false;
    });

    it('should notify subscribers on deletion', (done) => {
      stateManager.set('key', 'value');

      stateManager.subscribe('key', (newValue, oldValue) => {
        expect(newValue).to.be.undefined;
        expect(oldValue).to.equal('value');
        done();
      });

      stateManager.delete('key');
    });
  });

  describe('clear', () => {
    it('should remove all state', () => {
      stateManager.set('key1', 'value1');
      stateManager.set('key2', 'value2');
      
      stateManager.clear();
      
      expect(stateManager.has('key1')).to.be.false;
      expect(stateManager.has('key2')).to.be.false;
    });
  });

  describe('getHistory', () => {
    it('should track state changes', () => {
      stateManager.set('counter', 1);
      stateManager.set('counter', 2);
      stateManager.set('counter', 3);

      const history = stateManager.getHistory('counter');
      
      expect(history).to.have.lengthOf(3);
      expect(history[0].value).to.equal(1);
      expect(history[2].value).to.equal(3);
    });

    it('should limit history size', () => {
      for (let i = 0; i < 150; i++) {
        stateManager.set('key', i);
      }

      const history = stateManager.getHistory('key');
      expect(history.length).to.be.at.most(100);
    });
  });

});
