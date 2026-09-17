import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveConfig } from '../src/config.js';

describe('resolveConfig', () => {
  it('requires apiKey', () => {
    assert.throws(() => resolveConfig({ name: 'Nimbio' }), /apiKey/);
  });

  it('applies defaults', () => {
    const cfg = resolveConfig({ apiKey: 'nimbio_test_abc' });
    assert.equal(cfg.name, 'Nimbio');
    assert.equal(cfg.accessoryType, 'garageDoor');
    assert.equal(cfg.autoCloseSeconds, 25);
    assert.equal(cfg.pollIntervalSeconds, 30);
    assert.equal(cfg.pulseOnClose, false);
    assert.equal(cfg.openNote, 'HomeKit');
    assert.equal(cfg.timeoutSeconds, 45);
    assert.equal(cfg.latchIds, null);
  });

  it('parses latch filters and clamps ranges', () => {
    const cfg = resolveConfig({
      apiKey: '  nimbio_live_xyz  ',
      latchIds: [' a ', '', 'b'],
      latchNames: { a: ' Front Gate ' },
      accessoryType: 'switch',
      autoCloseSeconds: 2,
      pollIntervalSeconds: 99999,
      pulseOnClose: true,
      timeoutSeconds: 5,
    });
    assert.equal(cfg.apiKey, 'nimbio_live_xyz');
    assert.ok(cfg.latchIds);
    assert.deepEqual([...cfg.latchIds!].sort(), ['a', 'b']);
    assert.equal(cfg.latchNames.a, 'Front Gate');
    assert.equal(cfg.accessoryType, 'switch');
    assert.equal(cfg.autoCloseSeconds, 5);
    assert.equal(cfg.pollIntervalSeconds, 3600);
    assert.equal(cfg.pulseOnClose, true);
    assert.equal(cfg.timeoutSeconds, 15);
  });
});
