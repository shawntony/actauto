/**
 * Execution timer utilities for Google Apps Script
 *
 * Provides reusable functions for tracking execution time and managing time constraints.
 */

/**
 * Creates a new execution timer
 * @param {number} maxExecutionTime - Maximum execution time in milliseconds (default: 5 minutes)
 * @returns {Object} Timer object with utility methods
 */
function createExecutionTimer(maxExecutionTime = 5 * 60 * 1000) {
  const startTime = new Date().getTime();

  return {
    /**
     * Gets elapsed time in milliseconds
     * @returns {number} Elapsed time in ms
     */
    getElapsedTime() {
      return new Date().getTime() - startTime;
    },

    /**
     * Gets elapsed time in seconds
     * @returns {number} Elapsed time in seconds
     */
    getElapsedSeconds() {
      return Math.round(this.getElapsedTime() / 1000);
    },

    /**
     * Gets remaining time in milliseconds
     * @returns {number} Remaining time in ms
     */
    getRemainingTime() {
      return Math.max(0, maxExecutionTime - this.getElapsedTime());
    },

    /**
     * Gets remaining time in seconds
     * @returns {number} Remaining time in seconds
     */
    getRemainingSeconds() {
      return Math.round(this.getRemainingTime() / 1000);
    },

    /**
     * Checks if execution time limit has been exceeded
     * @returns {boolean} True if time limit exceeded
     */
    isTimeExceeded() {
      return this.getElapsedTime() > maxExecutionTime;
    },

    /**
     * Checks if execution is nearing time limit
     * @param {number} warningThreshold - Warning threshold (0.0 to 1.0, default: 0.8)
     * @returns {boolean} True if within warning threshold
     */
    isNearingTimeLimit(warningThreshold = 0.8) {
      return this.getElapsedTime() > (maxExecutionTime * warningThreshold);
    },

    /**
     * Gets progress percentage (0-100)
     * @returns {number} Percentage of execution time used
     */
    getProgressPercentage() {
      return Math.min(100, Math.round((this.getElapsedTime() / maxExecutionTime) * 100));
    },

    /**
     * Logs current time status
     */
    logStatus() {
      Logger.log(`Execution time: ${this.getElapsedSeconds()}s / ${Math.round(maxExecutionTime / 1000)}s (${this.getProgressPercentage()}%)`);
    },

    /**
     * Gets the start time timestamp
     * @returns {number} Start time in milliseconds
     */
    getStartTime() {
      return startTime;
    },

    /**
     * Gets max execution time
     * @returns {number} Max execution time in milliseconds
     */
    getMaxExecutionTime() {
      return maxExecutionTime;
    }
  };
}

/**
 * Simple execution time tracker
 */
const ExecutionTimer = {
  /**
   * Starts a timer and returns elapsed time function
   * @returns {Function} Function that returns elapsed time in ms
   */
  start() {
    const startTime = new Date().getTime();
    return () => new Date().getTime() - startTime;
  },

  /**
   * Checks if elapsed time exceeds limit
   * @param {number} startTime - Start time in milliseconds
   * @param {number} maxTime - Maximum time in milliseconds
   * @returns {boolean} True if time exceeded
   */
  isExceeded(startTime, maxTime) {
    return (new Date().getTime() - startTime) > maxTime;
  },

  /**
   * Gets elapsed time in seconds
   * @param {number} startTime - Start time in milliseconds
   * @returns {number} Elapsed seconds
   */
  getElapsedSeconds(startTime) {
    return Math.round((new Date().getTime() - startTime) / 1000);
  },

  /**
   * Formats time in milliseconds to readable format
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} Formatted time string (e.g., "2m 30s")
   */
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${seconds}초`;
  },

  /**
   * Creates a timeout checker function
   * @param {number} maxTime - Maximum time in milliseconds
   * @returns {Object} Timeout checker object
   */
  createTimeoutChecker(maxTime) {
    const startTime = new Date().getTime();

    return {
      check() {
        const elapsed = new Date().getTime() - startTime;
        if (elapsed > maxTime) {
          throw new Error(`실행 시간 초과: ${Math.round(elapsed / 1000)}초 (최대: ${Math.round(maxTime / 1000)}초)`);
        }
      },
      getElapsed() {
        return new Date().getTime() - startTime;
      },
      isNearLimit(threshold = 0.9) {
        return this.getElapsed() > (maxTime * threshold);
      }
    };
  }
};
