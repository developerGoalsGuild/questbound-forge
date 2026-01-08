/**
 * Data Access Layer Abstraction
 * Provides unified interface for data operations across different storage systems
 */

export interface DataRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
  exists(id: ID): Promise<boolean>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  filter?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DataSource {
  name: string;
  type: 'memory' | 'localStorage' | 'indexedDB' | 'api' | 'websocket';
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// Base repository implementation
export abstract class BaseRepository<T, ID = string> implements DataRepository<T, ID> {
  protected dataSource: DataSource;
  protected cache = new Map<ID, T>();
  protected cacheTimeout = 300000; // 5 minutes
  protected cacheTimestamps = new Map<ID, number>();

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  abstract findById(id: ID): Promise<T | null>;
  abstract findAll(filter?: Partial<T>): Promise<T[]>;
  abstract create(entity: Omit<T, 'id'>): Promise<T>;
  abstract update(id: ID, updates: Partial<T>): Promise<T>;
  abstract delete(id: ID): Promise<boolean>;
  abstract count(filter?: Partial<T>): Promise<number>;
  abstract exists(id: ID): Promise<boolean>;

  protected isCacheValid(id: ID): boolean {
    const timestamp = this.cacheTimestamps.get(id);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.cacheTimeout;
  }

  protected setCache(id: ID, entity: T): void {
    this.cache.set(id, entity);
    this.cacheTimestamps.set(id, Date.now());
  }

  protected getCache(id: ID): T | null {
    if (this.isCacheValid(id)) {
      return this.cache.get(id) || null;
    }
    this.cache.delete(id);
    this.cacheTimestamps.delete(id);
    return null;
  }

  protected clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

// Memory repository implementation
export class MemoryRepository<T extends { id: ID }, ID = string> extends BaseRepository<T, ID> {
  private data = new Map<ID, T>();

  async findById(id: ID): Promise<T | null> {
    const cached = this.getCache(id);
    if (cached) return cached;

    const entity = this.data.get(id) || null;
    if (entity) {
      this.setCache(id, entity);
    }
    return entity;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    const entities = Array.from(this.data.values());
    
    if (!filter) return entities;

    return entities.filter(entity => {
      return Object.entries(filter).every(([key, value]) => 
        entity[key as keyof T] === value
      );
    });
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const id = this.generateId() as ID;
    const newEntity = { ...entity, id } as T;
    this.data.set(id, newEntity);
    this.setCache(id, newEntity);
    return newEntity;
  }

  async update(id: ID, updates: Partial<T>): Promise<T> {
    const existing = this.data.get(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.data.set(id, updated);
    this.setCache(id, updated);
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const existed = this.data.has(id);
    this.data.delete(id);
    this.cache.delete(id);
    this.cacheTimestamps.delete(id);
    return existed;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findAll(filter);
    return entities.length;
  }

  async exists(id: ID): Promise<boolean> {
    return this.data.has(id);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// LocalStorage repository implementation
export class LocalStorageRepository<T extends { id: ID }, ID = string> extends BaseRepository<T, ID> {
  private storageKey: string;

  constructor(dataSource: DataSource, storageKey: string) {
    super(dataSource);
    this.storageKey = storageKey;
  }

  async findById(id: ID): Promise<T | null> {
    const cached = this.getCache(id);
    if (cached) return cached;

    const data = this.loadFromStorage();
    const entity = data.get(id) || null;
    if (entity) {
      this.setCache(id, entity);
    }
    return entity;
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    const data = this.loadFromStorage();
    const entities = Array.from(data.values());
    
    if (!filter) return entities;

    return entities.filter(entity => {
      return Object.entries(filter).every(([key, value]) => 
        entity[key as keyof T] === value
      );
    });
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const id = this.generateId() as ID;
    const newEntity = { ...entity, id } as T;
    
    const data = this.loadFromStorage();
    data.set(id, newEntity);
    this.saveToStorage(data);
    this.setCache(id, newEntity);
    
    return newEntity;
  }

  async update(id: ID, updates: Partial<T>): Promise<T> {
    const data = this.loadFromStorage();
    const existing = data.get(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    data.set(id, updated);
    this.saveToStorage(data);
    this.setCache(id, updated);
    
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const data = this.loadFromStorage();
    const existed = data.has(id);
    data.delete(id);
    this.saveToStorage(data);
    this.cache.delete(id);
    this.cacheTimestamps.delete(id);
    
    return existed;
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findAll(filter);
    return entities.length;
  }

  async exists(id: ID): Promise<boolean> {
    const data = this.loadFromStorage();
    return data.has(id);
  }

  private loadFromStorage(): Map<ID, T> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data)) as Map<ID, T>;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return new Map();
    }
  }

  private saveToStorage(data: Map<ID, T>): void {
    try {
      const serialized = Object.fromEntries(data);
      localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// API repository implementation
export class ApiRepository<T extends { id: ID }, ID = string> extends BaseRepository<T, ID> {
  private baseUrl: string;
  private apiKey?: string;

  constructor(dataSource: DataSource, baseUrl: string, apiKey?: string) {
    super(dataSource);
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async findById(id: ID): Promise<T | null> {
    const cached = this.getCache(id);
    if (cached) return cached;

    try {
      const response = await this.makeRequest(`/${id}`);
      const entity = response.data;
      this.setCache(id, entity);
      return entity;
    } catch (error) {
      console.error(`Failed to fetch entity ${id}:`, error);
      return null;
    }
  }

  async findAll(filter?: Partial<T>): Promise<T[]> {
    try {
      const params = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }

      const response = await this.makeRequest(`?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch entities:', error);
      return [];
    }
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const response = await this.makeRequest('', {
        method: 'POST',
        body: JSON.stringify(entity)
      });
      const newEntity = response.data;
      this.setCache(newEntity.id, newEntity);
      return newEntity;
    } catch (error) {
      console.error('Failed to create entity:', error);
      throw error;
    }
  }

  async update(id: ID, updates: Partial<T>): Promise<T> {
    try {
      const response = await this.makeRequest(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const updated = response.data;
      this.setCache(id, updated);
      return updated;
    } catch (error) {
      console.error(`Failed to update entity ${id}:`, error);
      throw error;
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      await this.makeRequest(`/${id}`, { method: 'DELETE' });
      this.cache.delete(id);
      this.cacheTimestamps.delete(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete entity ${id}:`, error);
      return false;
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }

      const response = await this.makeRequest(`/count?${params.toString()}`);
      return response.count;
    } catch (error) {
      console.error('Failed to count entities:', error);
      return 0;
    }
  }

  async exists(id: ID): Promise<boolean> {
    try {
      await this.makeRequest(`/${id}/exists`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Repository factory
export class RepositoryFactory {
  static createMemory<T extends { id: ID }, ID = string>(
    dataSource: DataSource
  ): DataRepository<T, ID> {
    return new MemoryRepository<T, ID>(dataSource);
  }

  static createLocalStorage<T extends { id: ID }, ID = string>(
    dataSource: DataSource,
    storageKey: string
  ): DataRepository<T, ID> {
    return new LocalStorageRepository<T, ID>(dataSource, storageKey);
  }

  static createApi<T extends { id: ID }, ID = string>(
    dataSource: DataSource,
    baseUrl: string,
    apiKey?: string
  ): DataRepository<T, ID> {
    return new ApiRepository<T, ID>(dataSource, baseUrl, apiKey);
  }
}

// Data source implementations
export class MemoryDataSource implements DataSource {
  name = 'memory';
  type = 'memory' as const;
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export class LocalStorageDataSource implements DataSource {
  name = 'localStorage';
  type = 'localStorage' as const;
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export class ApiDataSource implements DataSource {
  name = 'api';
  type = 'api' as const;
  private connected = false;

  constructor(private baseUrl: string) {}

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      this.connected = response.ok;
    } catch {
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
