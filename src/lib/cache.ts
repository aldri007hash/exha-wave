const cache = new Map<string, { data: any; expiry: number }>()

export function getCached<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key)
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data as T)
  }
  return fetchFn().then(data => {
    cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 })
    return data
  })
}

export function invalidateCache(key: string) {
  cache.delete(key)
}
