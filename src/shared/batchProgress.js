/**
 * Batch progress tracking utilities for Google Apps Script
 *
 * Provides reusable functions for managing batch processing progress and state.
 */

/**
 * Creates a new batch progress tracker
 * @param {string} progressKey - Unique key for storing progress in ScriptProperties
 * @param {number} totalItems - Total number of items to process
 * @returns {Object} Progress tracker object
 */
function createBatchProgress(progressKey, totalItems) {
  const scriptProperties = PropertiesService.getScriptProperties();

  return {
    /**
     * Initializes progress tracking
     * @param {Object} customData - Optional custom data to store with progress
     */
    initialize(customData = {}) {
      const progress = {
        currentIndex: 0,
        totalItems: totalItems,
        startTime: new Date().toISOString(),
        results: {
          success: 0,
          failed: 0,
          skipped: 0
        },
        ...customData
      };

      scriptProperties.setProperty(progressKey, JSON.stringify(progress));
      Logger.log(`Progress initialized: ${progressKey}`);
    },

    /**
     * Loads current progress
     * @returns {Object|null} Progress object or null if not found
     */
    load() {
      const progressJson = scriptProperties.getProperty(progressKey);
      if (!progressJson) {
        Logger.log(`Progress not found: ${progressKey}`);
        return null;
      }
      return JSON.parse(progressJson);
    },

    /**
     * Saves progress
     * @param {Object} progress - Progress object to save
     */
    save(progress) {
      scriptProperties.setProperty(progressKey, JSON.stringify(progress));
    },

    /**
     * Updates progress for successful item
     * @param {Object} customData - Optional custom data to merge
     */
    recordSuccess(customData = {}) {
      const progress = this.load();
      if (!progress) return;

      progress.currentIndex++;
      progress.results.success++;
      Object.assign(progress, customData);

      this.save(progress);
    },

    /**
     * Updates progress for failed item
     * @param {Object} customData - Optional custom data to merge
     */
    recordFailure(customData = {}) {
      const progress = this.load();
      if (!progress) return;

      progress.currentIndex++;
      progress.results.failed++;
      Object.assign(progress, customData);

      this.save(progress);
    },

    /**
     * Updates progress for skipped item
     * @param {Object} customData - Optional custom data to merge
     */
    recordSkipped(customData = {}) {
      const progress = this.load();
      if (!progress) return;

      progress.currentIndex++;
      progress.results.skipped++;
      Object.assign(progress, customData);

      this.save(progress);
    },

    /**
     * Checks if all items have been processed
     * @returns {boolean} True if complete
     */
    isComplete() {
      const progress = this.load();
      return progress && progress.currentIndex >= progress.totalItems;
    },

    /**
     * Gets completion percentage
     * @returns {number} Percentage (0-100)
     */
    getPercentage() {
      const progress = this.load();
      if (!progress) return 0;
      return Math.round((progress.currentIndex / progress.totalItems) * 100);
    },

    /**
     * Deletes progress data
     */
    clear() {
      scriptProperties.deleteProperty(progressKey);
      Logger.log(`Progress cleared: ${progressKey}`);
    },

    /**
     * Logs current progress status
     */
    logStatus() {
      const progress = this.load();
      if (!progress) {
        Logger.log('No progress data found');
        return;
      }

      Logger.log(`=== Progress Status ===`);
      Logger.log(`Items: ${progress.currentIndex}/${progress.totalItems} (${this.getPercentage()}%)`);
      Logger.log(`✅ Success: ${progress.results.success}`);
      Logger.log(`❌ Failed: ${progress.results.failed}`);
      Logger.log(`⊘ Skipped: ${progress.results.skipped}`);
      Logger.log(`⏰ Started: ${progress.startTime}`);
    }
  };
}

/**
 * Simple batch progress utilities
 */
const BatchProgress = {
  /**
   * Initializes a new batch progress
   * @param {string} key - Progress key
   * @param {number} total - Total items
   * @param {Object} customData - Optional custom data
   */
  init(key, total, customData = {}) {
    const progress = createBatchProgress(key, total);
    progress.initialize(customData);
  },

  /**
   * Gets current progress
   * @param {string} key - Progress key
   * @returns {Object|null} Progress object
   */
  get(key) {
    const scriptProperties = PropertiesService.getScriptProperties();
    const progressJson = scriptProperties.getProperty(key);
    return progressJson ? JSON.parse(progressJson) : null;
  },

  /**
   * Updates progress
   * @param {string} key - Progress key
   * @param {Object} updates - Updates to apply
   */
  update(key, updates) {
    const scriptProperties = PropertiesService.getScriptProperties();
    const progress = this.get(key);
    if (!progress) return;

    Object.assign(progress, updates);
    scriptProperties.setProperty(key, JSON.stringify(progress));
  },

  /**
   * Increments current index
   * @param {string} key - Progress key
   * @param {string} resultType - 'success', 'failed', or 'skipped'
   */
  increment(key, resultType = 'success') {
    const progress = this.get(key);
    if (!progress) return;

    progress.currentIndex++;
    if (resultType && progress.results[resultType] !== undefined) {
      progress.results[resultType]++;
    }

    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(key, JSON.stringify(progress));
  },

  /**
   * Checks if batch is complete
   * @param {string} key - Progress key
   * @returns {boolean} True if complete
   */
  isComplete(key) {
    const progress = this.get(key);
    return progress && progress.currentIndex >= progress.totalItems;
  },

  /**
   * Deletes progress
   * @param {string} key - Progress key
   */
  delete(key) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.deleteProperty(key);
  },

  /**
   * Gets summary of all progress items
   * @param {string} keyPrefix - Optional prefix to filter progress keys
   * @returns {Array<Object>} Array of progress summaries
   */
  listAll(keyPrefix = '') {
    const scriptProperties = PropertiesService.getScriptProperties();
    const allProps = scriptProperties.getProperties();
    const summaries = [];

    for (const [key, value] of Object.entries(allProps)) {
      if (keyPrefix && !key.startsWith(keyPrefix)) continue;

      try {
        const progress = JSON.parse(value);
        if (progress.currentIndex !== undefined && progress.totalItems !== undefined) {
          summaries.push({
            key: key,
            percentage: Math.round((progress.currentIndex / progress.totalItems) * 100),
            ...progress
          });
        }
      } catch (e) {
        // Skip non-progress properties
      }
    }

    return summaries;
  }
};
