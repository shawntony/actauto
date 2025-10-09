/**
 * Delay utilities for Google Apps Script
 *
 * Provides consistent delay/wait functionality across all scripts.
 */

const DelayUtils = {
  /**
   * Standard wait between operations (500ms)
   * Use for general operations that need a brief pause
   */
  standard() {
    Utilities.sleep(500);
  },

  /**
   * Wait after sheet creation (500ms)
   * Ensures sheet is fully created before further operations
   */
  afterSheetCreation() {
    Utilities.sleep(500);
  },

  /**
   * Custom delay with specified milliseconds
   * @param {number} milliseconds - Delay duration in milliseconds
   */
  custom(milliseconds) {
    Utilities.sleep(milliseconds);
  },

  /**
   * Short delay (250ms)
   * Use for quick operations that need minimal pause
   */
  short() {
    Utilities.sleep(250);
  },

  /**
   * Long delay (1000ms / 1 second)
   * Use for operations that need more time to settle
   */
  long() {
    Utilities.sleep(1000);
  }
};
