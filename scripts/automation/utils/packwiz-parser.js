import fs from 'fs/promises';
import path from 'path';
import TOML from 'toml';

/**
 * Packwiz TOML parser utilities
 */
export class PackwizParser {
  constructor(modsDir = 'mods') {
    this.modsDir = path.join(process.cwd(), modsDir);
  }

  /**
   * Read and parse a .pw.toml file
   * @param {string} filePath - Path to the .pw.toml file
   * @returns {object} Parsed TOML data
   */
  async parseModFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = TOML.parse(content);
      return data;
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all .pw.toml files in the mods directory
   * @returns {Array<string>} Array of file paths
   */
  async getAllModFiles() {
    try {
      const files = await fs.readdir(this.modsDir);
      const modFiles = files
        .filter(f => f.endsWith('.pw.toml'))
        .map(f => path.join(this.modsDir, f));
      return modFiles;
    } catch (error) {
      console.error('Failed to read mods directory:', error.message);
      return [];
    }
  }

  /**
   * Extract mod metadata from all .pw.toml files
   * @returns {Array} Array of mod metadata objects
   */
  async getAllModsMetadata() {
    const modFiles = await this.getAllModFiles();
    const mods = [];

    for (const filePath of modFiles) {
      try {
        const data = await this.parseModFile(filePath);

        if (data.update && data.update.modrinth) {
          mods.push({
            filePath,
            fileName: path.basename(filePath),
            name: data.name,
            projectId: data.update.modrinth['mod-id'],
            currentVersionId: data.update.modrinth.version,
            side: data.side || 'both',
            mcVersions: data['x-prismlauncher-mc-versions'] || []
          });
        }
      } catch (error) {
        console.error(`Skipping ${filePath}:`, error.message);
      }
    }

    return mods;
  }

  /**
   * Read pack.toml to get Minecraft and Fabric loader versions
   * @returns {object} Pack metadata {mcVersion, fabricVersion}
   */
  async getPackMetadata() {
    const packPath = path.join(process.cwd(), 'pack.toml');

    try {
      const content = await fs.readFile(packPath, 'utf-8');
      const data = TOML.parse(content);

      return {
        name: data.name,
        mcVersion: data.versions?.minecraft || null,
        fabricVersion: data.versions?.fabric || null,
        packFormat: data['pack-format'],
        index: data.index
      };
    } catch (error) {
      console.error('Failed to read pack.toml:', error.message);
      throw error;
    }
  }

  /**
   * Update pack.toml with new versions
   * @param {object} updates - {mcVersion?, fabricVersion?}
   */
  async updatePackMetadata(updates) {
    const packPath = path.join(process.cwd(), 'pack.toml');

    try {
      let content = await fs.readFile(packPath, 'utf-8');

      if (updates.mcVersion) {
        content = content.replace(
          /minecraft\s*=\s*"[^"]+"/,
          `minecraft = "${updates.mcVersion}"`
        );
      }

      if (updates.fabricVersion) {
        content = content.replace(
          /fabric\s*=\s*"[^"]+"/,
          `fabric = "${updates.fabricVersion}"`
        );
      }

      await fs.writeFile(packPath, content, 'utf-8');
      console.log('Updated pack.toml successfully');
    } catch (error) {
      console.error('Failed to update pack.toml:', error.message);
      throw error;
    }
  }

  /**
   * Get mod name from file path (used for packwiz update command)
   * @param {string} filePath - Path to .pw.toml file
   * @returns {string} Mod name without extension
   */
  getModName(filePath) {
    const fileName = path.basename(filePath);
    return fileName.replace('.pw.toml', '');
  }

  /**
   * Check if mod is in skip list
   * @param {string} projectId - Modrinth project ID
   * @param {object} skipList - Skip list data
   * @returns {boolean} True if mod should be skipped
   */
  isModSkipped(projectId, skipList) {
    const now = new Date();

    const skipped = skipList.skipped.find(item => {
      if (item.modId !== projectId) return false;

      // Check if skip period has expired
      if (item.until) {
        const untilDate = new Date(item.until);
        return now < untilDate;
      }

      return true;
    });

    return !!skipped;
  }

  /**
   * Add mod to skip list
   * @param {string} projectId - Modrinth project ID
   * @param {string} reason - Reason for skipping
   * @param {string} until - ISO date string when to stop skipping
   */
  async addToSkipList(projectId, reason, until = null) {
    const skipListPath = path.join(process.cwd(), 'config/automation/mod-skip-list.json');

    try {
      const content = await fs.readFile(skipListPath, 'utf-8');
      const skipList = JSON.parse(content);

      // Remove existing entry if present
      skipList.skipped = skipList.skipped.filter(item => item.modId !== projectId);

      // Add new entry
      skipList.skipped.push({
        modId: projectId,
        reason,
        until,
        addedBy: 'automated-check',
        addedAt: new Date().toISOString()
      });

      await fs.writeFile(skipListPath, JSON.stringify(skipList, null, 2));
      console.log(`Added ${projectId} to skip list`);
    } catch (error) {
      console.error('Failed to update skip list:', error.message);
    }
  }
}

export default PackwizParser;
