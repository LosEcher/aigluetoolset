export class SimpleLruMap<K, V> {
  readonly #limit: number;
  readonly #map = new Map<K, V>();

  constructor(limit = 200) {
    this.#limit = Math.max(1, limit);
  }

  get(key: K): V | undefined {
    const value = this.#map.get(key);
    if (value === undefined) {
      return undefined;
    }
    this.#map.delete(key);
    this.#map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.#map.has(key)) {
      this.#map.delete(key);
    }
    this.#map.set(key, value);
    if (this.#map.size > this.#limit) {
      const oldestKey = this.#map.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.#map.delete(oldestKey);
      }
    }
  }
}
