import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';

const FABRIC_META_BASE = 'https://meta.fabricmc.net/v2';
const CACHE_DIR = path.join(process.cwd(), '.update-cache');
const CACHE_FILE = path.join(CACHE_DIR, 'fabric-cache.json');

/**
 * Fabric Meta API wrapper with caching
 */
export class FabricMetaAPI {
  constructor(config = {}) {
    this.cacheTtlHours = config.cacheTtlHours || 24;
    this.cache = new Map();
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

      console.log(`Loaded ${this.cache.size} cached Fabric entries`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load Fabric cache:', error.message);
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
      console.log(`Saved ${this.cache.size} Fabric entries to cache`);
    } catch (error) {
      console.warn('Failed to save Fabric cache:', error.message);
    }
  }

  /**
   * Get all loader versions for a Minecraft version
   */
  async getLoaderVersions(minecraftVersion) {
    const cacheKey = `loader:${minecraftVersion}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${FABRIC_META_BASE}/versions/loader/${minecraftVersion}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'lucasilverentand/lumo-optimized (github.com/lucasilverentand/lumo-optimized)'
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch Fabric loader versions for MC ${minecraftVersion}:`, error.message);
      return [];
    }
  }

  /**
   * Get latest stable loader version for a Minecraft version
   * @param {string} minecraftVersion - Minecraft version (e.g., "1.21.8")
   * @returns {object|null} Latest stable loader version or null
   */
  async getLatestStableLoader(minecraftVersion) {
    const versions = await this.getLoaderVersions(minecraftVersion);

    if (versions.length === 0) {
      return null;
    }

    // Filter to stable versions (no beta/alpha in version string)
    const stableVersions = versions.filter(v => {
      const loaderVersion = v.loader.version;
      return !loaderVersion.includes('beta') &&
             !loaderVersion.includes('alpha') &&
             !loaderVersion.includes('rc');
    });

    if (stableVersions.length === 0) {
      return null;
    }

    // Fabric Meta returns versions sorted by date (newest first)
    return stableVersions[0];
  }

  /**
   * Compare loader versions and check if update is available
   * @param {string} currentVersion - Current loader version (e.g., "0.16.5")
   * @param {string} minecraftVersion - Minecraft version to check against
   * @returns {object} {hasUpdate, currentVersion, latestVersion, changelog}
   */
  async checkLoaderUpdate(currentVersion, minecraftVersion) {
    const latestLoader = await this.getLatestStableLoader(minecraftVersion);

    if (!latestLoader) {
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
        error: 'No stable loader found'
      };
    }

    const latestVersion = latestLoader.loader.version;

    // Use semver for comparison
    const hasUpdate = semver.gt(latestVersion, currentVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      build: latestLoader.loader.build,
      maven: latestLoader.loader.maven,
      changelogUrl: `https://fabricmc.net/wiki/changelog/loader/${latestVersion}`
    };
  }

  /**
   * Get all Minecraft versions supported by Fabric
   */
  async getMinecraftVersions() {
    const cacheKey = 'minecraft:versions';
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${FABRIC_META_BASE}/versions/game`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'lucasilverentand/lumo-optimized (github.com/lucasilverentand/lumo-optimized)'
        }
      });

      const data = response.data;
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch Minecraft versions:', error.message);
      return [];
    }
  }

  /**
   * Get latest stable Minecraft version
   */
  async getLatestMinecraftVersion() {
    const versions = await this.getMinecraftVersions();

    // Filter to stable releases only
    const stableVersions = versions.filter(v => v.stable);

    if (stableVersions.length === 0) {
      return null;
    }

    return stableVersions[0];
  }

  /**
   * Get N most recent stable Minecraft versions
   * @param {number} count - Number of versions to return
   * @returns {Array} Array of version objects
   */
  async getRecentMinecraftVersions(count = 3) {
    const versions = await this.getMinecraftVersions();

    // Filter to stable releases only
    const stableVersions = versions.filter(v => v.stable);

    return stableVersions.slice(0, count);
  }
}

export default FabricMetaAPI;
