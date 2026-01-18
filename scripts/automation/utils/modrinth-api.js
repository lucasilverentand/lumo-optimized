import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const MODRINTH_API_BASE = 'https://api.modrinth.com/v2';
const CACHE_DIR = path.join(process.cwd(), '.update-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'modrinth-cache.json');

/**
 * Modrinth API wrapper with rate limiting and caching
 */
export class ModrinthAPI {
  constructor(config = {}) {
    this.batchSize = config.batchSize || 50;
    this.batchDelayMs = config.batchDelayMs || 200;
    this.cacheTtlHours = config.cacheTtlHours || 24;
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * Load cache from disk
   */
  async loadCache() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const data = await fs.readFile(CACHE_FILE, 'utf-8');
      const cacheData = JSON.parse(data);

      // Filter out expired entries
      const now = Date.now();
      const ttl = this.cacheTtlHours * 60 * 60 * 1000;

      Object.entries(cacheData).forEach(([key, entry]) => {
        if (now - entry.timestamp < ttl) {
          this.cache.set(key, entry.data);
        }
      });

      console.log(`Loaded ${this.cache.size} cached Modrinth entries`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load cache:', error.message);
      }
    }
  }

  /**
   * Save cache to disk
   */
  async saveCache() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });

      const cacheData = {};
      this.cache.forEach((data, key) => {
        cacheData[key] = {
          data,
          timestamp: Date.now()
        };
      });

      await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      console.log(`Saved ${this.cache.size} entries to cache`);
    } catch (error) {
      console.warn('Failed to save cache:', error.message);
    }
  }

  /**
   * Get cached value or return null
   */
  getCached(key) {
    return this.cache.get(key) || null;
  }

  /**
   * Set cache value
   */
  setCache(key, value) {
    this.cache.set(key, value);
  }

  /**
   * Make API request with rate limiting
   */
  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process request queue with batching and delays
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.batchSize);

      await Promise.all(
        batch.map(async ({ url, options, resolve, reject }) => {
          try {
            const response = await axios.get(url, {
              ...options,
              headers: {
                'User-Agent': 'lucasilverentand/lumo-optimized (github.com/lucasilverentand/lumo-optimized)',
                ...options.headers
              }
            });
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        })
      );

      // Delay between batches to respect rate limits
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelayMs));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get project information by project ID
   */
  async getProject(projectId) {
    const cacheKey = `project:${projectId}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${MODRINTH_API_BASE}/project/${projectId}`;
    const data = await this.request(url);
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * Get all versions for a project filtered by game version and loader
   */
  async getProjectVersions(projectId, gameVersions, loaders = ['fabric']) {
    const cacheKey = `versions:${projectId}:${gameVersions.join(',')}:${loaders.join(',')}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const gameVersionsParam = JSON.stringify(gameVersions);
    const loadersParam = JSON.stringify(loaders);
    const url = `${MODRINTH_API_BASE}/project/${projectId}/version?game_versions=${encodeURIComponent(gameVersionsParam)}&loaders=${encodeURIComponent(loadersParam)}`;

    const data = await this.request(url);
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * Get specific version by version ID
   */
  async getVersion(versionId) {
    const cacheKey = `version:${versionId}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${MODRINTH_API_BASE}/version/${versionId}`;
    const data = await this.request(url);
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * Get latest stable release version for a project
   * @param {string} projectId - Modrinth project ID
   * @param {string[]} gameVersions - Minecraft versions to filter by
   * @param {string[]} loaders - Mod loaders to filter by (default: ['fabric'])
   * @returns {object|null} Latest version or null if none found
   */
  async getLatestVersion(projectId, gameVersions, loaders = ['fabric']) {
    const versions = await this.getProjectVersions(projectId, gameVersions, loaders);

    // Filter to release versions only (no alpha/beta)
    const releaseVersions = versions.filter(v => v.version_type === 'release');

    if (releaseVersions.length === 0) {
      return null;
    }

    // Modrinth returns versions sorted by date (newest first)
    return releaseVersions[0];
  }

  /**
   * Batch get latest versions for multiple projects
   * @param {Array} mods - Array of {projectId, gameVersions, currentVersionId}
   * @returns {Array} Array of {projectId, currentVersion, latestVersion, hasUpdate, changelog}
   */
  async batchGetLatestVersions(mods) {
    const results = [];

    for (const mod of mods) {
      try {
        const [currentVersion, latestVersion] = await Promise.all([
          this.getVersion(mod.currentVersionId),
          this.getLatestVersion(mod.projectId, mod.gameVersions)
        ]);

        const hasUpdate = latestVersion && latestVersion.id !== currentVersion.id;

        results.push({
          projectId: mod.projectId,
          modName: mod.name,
          currentVersion: {
            id: currentVersion.id,
            version_number: currentVersion.version_number,
            date_published: currentVersion.date_published
          },
          latestVersion: latestVersion ? {
            id: latestVersion.id,
            version_number: latestVersion.version_number,
            date_published: latestVersion.date_published,
            changelog: latestVersion.changelog || 'No changelog provided'
          } : null,
          hasUpdate,
          updateUrl: hasUpdate ? `https://modrinth.com/mod/${mod.projectId}/version/${latestVersion.id}` : null
        });
      } catch (error) {
        console.error(`Failed to check updates for ${mod.name}:`, error.message);
        results.push({
          projectId: mod.projectId,
          modName: mod.name,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default ModrinthAPI;
