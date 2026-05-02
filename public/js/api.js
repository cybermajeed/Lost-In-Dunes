// public/js/api.js
// All fetch calls to our Node.js backend

const API = (() => {
  const BASE = '/api';

  async function req(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  return {
    // Players
    getOrCreatePlayer: (name) => req(`/players/${encodeURIComponent(name)}`),
    addExperience:     (id, amount) => req(`/players/${id}/experience`, 'POST', { amount }),

    // Artifacts
    discover:     (playerId, locationId) => req('/artifacts/discover', 'POST', { playerId, locationId }),
    getArtifacts: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return req(`/artifacts?${params}`);
    },
    getArtifact:  (id)   => req(`/artifacts/${id}`),
    analyze:      (id)   => req(`/artifacts/${id}/analyze`, 'POST'),

    // Locations
    getLocations: () => req('/locations'),
    getPatterns:  () => req('/locations/patterns'),
  };
})();
