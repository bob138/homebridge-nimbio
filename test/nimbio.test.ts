import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  classifyGateStatus,
  displayNameForLatch,
  filterLatches,
  type DiscoveredLatch,
} from '../src/nimbio/types.js';
import { discoverLatches, openLatch, type NimbioApi } from '../src/nimbio/api.js';

function latch(partial: Partial<DiscoveredLatch> & Pick<DiscoveredLatch, 'uniqueId' | 'latchId'>): DiscoveredLatch {
  return {
    name: 'Gate',
    offline: false,
    heldOpen: false,
    scope: 'account',
    hasStatus: false,
    ...partial,
  };
}

describe('classifyGateStatus', () => {
  it('classifies common labels', () => {
    assert.equal(classifyGateStatus('Open'), 'open');
    assert.equal(classifyGateStatus('CLOSED'), 'closed');
    assert.equal(classifyGateStatus('Opening'), 'opening');
    assert.equal(classifyGateStatus('Closing'), 'closing');
    assert.equal(classifyGateStatus('held_open'), 'open');
    assert.equal(classifyGateStatus('Unlocked'), 'open');
    assert.equal(classifyGateStatus('Locked'), 'closed');
    assert.equal(classifyGateStatus('obstructed'), 'stopped');
    assert.equal(classifyGateStatus(''), 'unknown');
    assert.equal(classifyGateStatus(null), 'unknown');
  });
});

describe('displayNameForLatch / filterLatches', () => {
  it('applies overrides and prefixes', () => {
    assert.equal(
      displayNameForLatch({ latchId: 'l1', name: 'Front' }, { namePrefix: 'Nimbio ', latchNames: { l1: 'Main Gate' } }),
      'Nimbio Main Gate',
    );
    assert.equal(
      displayNameForLatch({ latchId: 'l1', name: 'Front' }, { namePrefix: 'Nimbio' }),
      'NimbioFront',
    );
  });

  it('filters by latch id set', () => {
    const latches = [
      latch({ uniqueId: 'a:l1', latchId: 'l1' }),
      latch({ uniqueId: 'a:l2', latchId: 'l2' }),
    ];
    assert.equal(filterLatches(latches, null).length, 2);
    assert.deepEqual(filterLatches(latches, new Set(['l2'])).map(l => l.latchId), ['l2']);
  });
});

describe('discoverLatches / openLatch', () => {
  it('discovers account latches and opens via key+latch', async () => {
    const opens: Array<[string, string, string?]> = [];
    const api: NimbioApi = {
      me: async () => ({
        accountId: 'acc',
        key: {
          apiKeyId: 'k',
          prefix: 'nimbio_test_',
          name: 'test',
          mode: 'test',
          type: 'account',
          communityId: null,
          capabilities: ['open'],
          lastUsedDatetime: null,
          minuteLimit: null,
          minuteCount: null,
          monthLimit: null,
          monthCount: null,
          raw: {},
        },
        raw: {},
      }),
      listAccountKeys: async () => ([
        {
          id: 'key-1',
          name: 'Home',
          home: null,
          disabled: false,
          hidden: false,
          pending: false,
          parentName: null,
          latches: [
            { id: 'latch-1', name: 'Front Gate', offline: false, location: 'Entrance', heldOpen: false, raw: {} },
          ],
          raw: {},
        },
        {
          id: 'key-disabled',
          name: 'Off',
          home: null,
          disabled: true,
          hidden: false,
          pending: false,
          parentName: null,
          latches: [
            { id: 'latch-x', name: 'Hidden', offline: false, location: null, heldOpen: false, raw: {} },
          ],
          raw: {},
        },
      ]),
      accountOpen: async (keyId, latchId, note) => {
        opens.push([keyId, latchId, note]);
        return {};
      },
      communityGateStatus: async () => ({ latches: [], raw: {} }),
      communityOpen: async () => {
        throw new Error('should not call community open');
      },
    };

    const result = await discoverLatches(api);
    assert.equal(result.scope, 'account');
    assert.equal(result.latches.length, 1);
    assert.equal(result.latches[0].latchId, 'latch-1');
    assert.equal(result.latches[0].keyId, 'key-1');
    assert.equal(result.latches[0].hasStatus, false);

    await openLatch(api, result.latches[0], 'HomeKit');
    assert.deepEqual(opens, [['key-1', 'latch-1', 'HomeKit']]);
  });

  it('discovers community latches from gate-status', async () => {
    const opens: string[] = [];
    const api: NimbioApi = {
      me: async () => ({
        accountId: 'acc',
        key: {
          apiKeyId: 'k',
          prefix: 'nimbio_live_',
          name: 'mgr',
          mode: 'live',
          type: 'community',
          communityId: 'c1',
          capabilities: ['open'],
          lastUsedDatetime: null,
          minuteLimit: null,
          minuteCount: null,
          monthLimit: null,
          monthCount: null,
          raw: {},
        },
        raw: {},
      }),
      listAccountKeys: async () => {
        throw new Error('should not list account keys');
      },
      accountOpen: async () => {
        throw new Error('should not account open');
      },
      communityGateStatus: async () => ({
        latches: [
          {
            latchId: 'latch-9',
            latchName: 'Community Gate',
            status: 'closed',
            offline: false,
            message: 'Closed',
            possibleStatuses: [{ status: 'open', transient: false, raw: {} }, { status: 'closed', transient: false, raw: {} }],
            raw: {},
          },
        ],
        raw: {},
      }),
      communityOpen: async (latchId) => {
        opens.push(latchId);
        return {};
      },
    };

    const result = await discoverLatches(api);
    assert.equal(result.scope, 'community');
    assert.equal(result.latches.length, 1);
    assert.equal(result.latches[0].hasStatus, true);
    assert.equal(result.latches[0].status, 'closed');

    await openLatch(api, result.latches[0], 'HomeKit');
    assert.deepEqual(opens, ['latch-9']);
  });
});
