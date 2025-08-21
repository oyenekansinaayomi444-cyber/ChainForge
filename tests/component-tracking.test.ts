import { describe, it, expect, beforeEach } from 'vitest';

interface Component {
  serialNumber: string;
  material: string;
  producer: string;
  createdAt: bigint;
  updatedAt: bigint;
}

interface LifecycleEvent {
  status: bigint;
  timestamp: bigint;
  notes: string;
  recordedBy: string;
}

interface MockContract {
  admin: string;
  paused: boolean;
  lastComponentId: bigint;
  components: Map<string, Component>;
  lifecycleEvents: Map<string, LifecycleEvent>;
  eventCounters: Map<string, bigint>;
  roles: Map<string, bigint>;
  MAX_BATCH_SIZE: bigint;
  ROLE_ADMIN: bigint;
  ROLE_SUPPLIER: bigint;
  ROLE_REGULATOR: bigint;
  STATUS_PRODUCED: bigint;
  STATUS_TESTED: bigint;
  STATUS_SHIPPED: bigint;
  STATUS_DELIVERED: bigint;

  isAdmin(caller: string): boolean;
  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number };
  assignRole(caller: string, user: string, role: bigint): { value: boolean } | { error: number };
  registerComponent(caller: string, serialNumber: string, material: string): { value: bigint } | { error: number };
  registerBatch(caller: string, components: { serialNumber: string; material: string }[]): { value: bigint } | { error: number };
  addLifecycleEvent(caller: string, componentId: bigint, status: bigint, notes: string): { value: bigint } | { error: number };
  getComponent(componentId: bigint): { value: Component } | { error: number };
  getLifecycleEvent(componentId: bigint, eventIndex: bigint): { value: LifecycleEvent } | { error: number };
  getEventCount(componentId: bigint): { value: bigint };
  getRole(user: string): { value: bigint };
}

const mockContract: MockContract = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  paused: false,
  lastComponentId: 0n,
  components: new Map(),
  lifecycleEvents: new Map(),
  eventCounters: new Map(),
  roles: new Map(),
  MAX_BATCH_SIZE: 100n,
  ROLE_ADMIN: 1n,
  ROLE_SUPPLIER: 2n,
  ROLE_REGULATOR: 3n,
  STATUS_PRODUCED: 1n,
  STATUS_TESTED: 2n,
  STATUS_SHIPPED: 3n,
  STATUS_DELIVERED: 4n,

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  assignRole(caller: string, user: string, role: bigint) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (user === 'SP000000000000000000002Q6VF78') return { error: 105 };
    if (role !== this.ROLE_SUPPLIER && role !== this.ROLE_REGULATOR) return { error: 103 };
    this.roles.set(user, role);
    return { value: true };
  },

  registerComponent(caller: string, serialNumber: string, material: string) {
    if (this.paused) return { error: 104 };
    if (!this.roles.get(caller) && !this.isAdmin(caller)) return { error: 100 };
    const componentId = this.lastComponentId + 1n;
    const key = componentId.toString();
    if (this.components.has(key)) return { error: 102 };
    this.components.set(key, {
      serialNumber,
      material,
      producer: caller,
      createdAt: 100n,
      updatedAt: 100n,
    });
    this.eventCounters.set(key, 0n);
    this.lastComponentId = componentId;
    return { value: componentId };
  },

  registerBatch(caller: string, components: { serialNumber: string; material: string }[]) {
    if (this.paused) return { error: 104 };
    if (!this.roles.get(caller) && !this.isAdmin(caller)) return { error: 100 };
    if (BigInt(components.length) > this.MAX_BATCH_SIZE) return { error: 106 };
    let lastId = this.lastComponentId;
    for (const comp of components) {
      const componentId = lastId + 1n;
      const key = componentId.toString();
      if (this.components.has(key)) return { error: 102 };
      this.components.set(key, {
        serialNumber: comp.serialNumber,
        material: comp.material,
        producer: caller,
        createdAt: 100n,
        updatedAt: 100n,
      });
      this.eventCounters.set(key, 0n);
      lastId = componentId;
    }
    this.lastComponentId = lastId;
    return { value: lastId };
  },

  addLifecycleEvent(caller: string, componentId: bigint, status: bigint, notes: string) {
    if (this.paused) return { error: 104 };
    if (!this.roles.get(caller) && !this.isAdmin(caller)) return { error: 100 };
    if (!this.components.has(componentId.toString())) return { error: 101 };
    if (
      status !== this.STATUS_PRODUCED &&
      status !== this.STATUS_TESTED &&
      status !== this.STATUS_SHIPPED &&
      status !== this.STATUS_DELIVERED
    ) return { error: 104 };
    const eventIndex = (this.eventCounters.get(componentId.toString()) || 0n) + 1n;
    this.lifecycleEvents.set(`${componentId}-${eventIndex}`, {
      status,
      timestamp: 100n,
      notes,
      recordedBy: caller,
    });
    this.eventCounters.set(componentId.toString(), eventIndex);
    const comp = this.components.get(componentId.toString())!;
    this.components.set(componentId.toString(), { ...comp, updatedAt: 100n });
    return { value: eventIndex };
  },

  getComponent(componentId: bigint) {
    const comp = this.components.get(componentId.toString());
    return comp ? { value: comp } : { error: 101 };
  },

  getLifecycleEvent(componentId: bigint, eventIndex: bigint) {
    const event = this.lifecycleEvents.get(`${componentId}-${eventIndex}`);
    return event ? { value: event } : { error: 101 };
  },

  getEventCount(componentId: bigint) {
    return { value: this.eventCounters.get(componentId.toString()) || 0n };
  },

  getRole(user: string) {
    return { value: this.roles.get(user) || 0n };
  },
};

describe('Component Tracking Contract', () => {
  beforeEach(() => {
    mockContract.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContract.paused = false;
    mockContract.lastComponentId = 0n;
    mockContract.components = new Map();
    mockContract.lifecycleEvents = new Map();
    mockContract.eventCounters = new Map();
    mockContract.roles = new Map();
  });

  it('should assign supplier role by admin', () => {
    const result = mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    expect(result).toEqual({ value: true });
    expect(mockContract.getRole('ST2CY5...')).toEqual({ value: 2n });
  });

  it('should fail to assign role by non-admin', () => {
    const result = mockContract.assignRole('ST2CY5...', 'ST3NB...', 2n);
    expect(result).toEqual({ error: 100 });
  });

  it('should register a component by supplier', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    const result = mockContract.registerComponent('ST2CY5...', 'SN123', 'Titanium');
    expect(result).toEqual({ value: 1n });
    expect(mockContract.getComponent(1n)).toEqual({
      value: {
        serialNumber: 'SN123',
        material: 'Titanium',
        producer: 'ST2CY5...',
        createdAt: 100n,
        updatedAt: 100n,
      },
    });
  });

  it('should fail to register component when paused', () => {
    mockContract.setPaused(mockContract.admin, true);
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    const result = mockContract.registerComponent('ST2CY5...', 'SN123', 'Titanium');
    expect(result).toEqual({ error: 104 });
  });

  it('should register batch components', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    const components = [
      { serialNumber: 'SN001', material: 'Titanium' },
      { serialNumber: 'SN002', material: 'Aluminum' },
    ];
    const result = mockContract.registerBatch('ST2CY5...', components);
    expect(result).toEqual({ value: 2n });
    expect(mockContract.getComponent(1n)).toEqual({
      value: expect.objectContaining({ serialNumber: 'SN001', material: 'Titanium' }),
    });
    expect(mockContract.getComponent(2n)).toEqual({
      value: expect.objectContaining({ serialNumber: 'SN002', material: 'Aluminum' }),
    });
  });

  it('should fail batch registration if exceeds max batch size', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    const components = Array(101).fill({ serialNumber: 'SN', material: 'Titanium' });
    const result = mockContract.registerBatch('ST2CY5...', components);
    expect(result).toEqual({ error: 106 });
  });

  it('should add lifecycle event', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    mockContract.registerComponent('ST2CY5...', 'SN123', 'Titanium');
    const result = mockContract.addLifecycleEvent('ST2CY5...', 1n, 1n, 'Produced');
    expect(result).toEqual({ value: 1n });
    expect(mockContract.getLifecycleEvent(1n, 1n)).toEqual({
      value: { status: 1n, timestamp: 100n, notes: 'Produced', recordedBy: 'ST2CY5...' },
    });
  });

  it('should fail to add lifecycle event for invalid component', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    const result = mockContract.addLifecycleEvent('ST2CY5...', 999n, 1n, 'Produced');
    expect(result).toEqual({ error: 101 });
  });

  it('should fail to add lifecycle event with invalid status', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    mockContract.registerComponent('ST2CY5...', 'SN123', 'Titanium');
    const result = mockContract.addLifecycleEvent('ST2CY5...', 1n, 999n, 'Invalid');
    expect(result).toEqual({ error: 104 });
  });

  it('should retrieve event count', () => {
    mockContract.assignRole(mockContract.admin, 'ST2CY5...', 2n);
    mockContract.registerComponent('ST2CY5...', 'SN123', 'Titanium');
    mockContract.addLifecycleEvent('ST2CY5...', 1n, 1n, 'Produced');
    const result = mockContract.getEventCount(1n);
    expect(result).toEqual({ value: 1n });
  });
});