/**
 * Trigger management utilities for Google Apps Script
 *
 * Provides reusable functions for creating, managing, and cleaning up ScriptApp triggers.
 */

/**
 * Creates a time-based trigger to run after a delay
 * @param {string} functionName - Name of the function to trigger
 * @param {number} delayMinutes - Delay in minutes (default: 1)
 * @returns {Trigger} Created trigger object
 */
function createDelayedTrigger(functionName, delayMinutes = 1) {
  Logger.log(`Creating delayed trigger for ${functionName} (${delayMinutes} minute(s))`);

  return ScriptApp.newTrigger(functionName)
    .timeBased()
    .after(delayMinutes * 60 * 1000)
    .create();
}

/**
 * Creates a time-based trigger to run at a specific time
 * @param {string} functionName - Name of the function to trigger
 * @param {Date} runTime - Time to run the trigger
 * @returns {Trigger} Created trigger object
 */
function createScheduledTrigger(functionName, runTime) {
  Logger.log(`Creating scheduled trigger for ${functionName} at ${runTime.toISOString()}`);

  return ScriptApp.newTrigger(functionName)
    .timeBased()
    .at(runTime)
    .create();
}

/**
 * Deletes all triggers for a specific function
 * @param {string} functionName - Name of the function
 * @returns {number} Number of triggers deleted
 */
function deleteTriggersForFunction(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  });

  if (deletedCount > 0) {
    Logger.log(`Deleted ${deletedCount} trigger(s) for ${functionName}`);
  }

  return deletedCount;
}

/**
 * Deletes all project triggers
 * @returns {number} Number of triggers deleted
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const count = triggers.length;

  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  if (count > 0) {
    Logger.log(`Deleted all ${count} trigger(s)`);
  }

  return count;
}

/**
 * Lists all triggers with their details
 * @returns {Array<Object>} Array of trigger information
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  return triggers.map(trigger => ({
    handlerFunction: trigger.getHandlerFunction(),
    triggerSource: trigger.getTriggerSource().toString(),
    eventType: trigger.getEventType().toString(),
    uniqueId: trigger.getUniqueId()
  }));
}

/**
 * Checks if a function has active triggers
 * @param {string} functionName - Name of the function
 * @returns {boolean} True if function has triggers
 */
function hasTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.some(trigger => trigger.getHandlerFunction() === functionName);
}

/**
 * Gets count of triggers for a function
 * @param {string} functionName - Name of the function
 * @returns {number} Number of active triggers
 */
function getTriggerCount(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  return triggers.filter(trigger => trigger.getHandlerFunction() === functionName).length;
}

/**
 * Trigger manager object with utility methods
 */
const TriggerManager = {
  /**
   * Creates a trigger to continue batch processing
   * @param {string} functionName - Batch processing function name
   * @param {number} delayMinutes - Delay before next batch (default: 1)
   */
  scheduleNextBatch(functionName, delayMinutes = 1) {
    this.cleanup(functionName);
    createDelayedTrigger(functionName, delayMinutes);
    Logger.log(`Next batch scheduled for ${functionName} in ${delayMinutes} minute(s)`);
  },

  /**
   * Cleans up triggers for a function
   * @param {string} functionName - Function name
   * @returns {number} Number of triggers deleted
   */
  cleanup(functionName) {
    return deleteTriggersForFunction(functionName);
  },

  /**
   * Cleans up all triggers
   * @returns {number} Number of triggers deleted
   */
  cleanupAll() {
    return deleteAllTriggers();
  },

  /**
   * Lists all triggers
   * @returns {Array<Object>} Trigger information array
   */
  list() {
    return listTriggers();
  },

  /**
   * Logs trigger information
   * @param {string} functionName - Optional function name to filter
   */
  logStatus(functionName = null) {
    const allTriggers = listTriggers();
    const triggers = functionName
      ? allTriggers.filter(t => t.handlerFunction === functionName)
      : allTriggers;

    Logger.log('=== Trigger Status ===');
    if (triggers.length === 0) {
      Logger.log('No active triggers');
    } else {
      triggers.forEach((trigger, index) => {
        Logger.log(`${index + 1}. ${trigger.handlerFunction} (${trigger.eventType})`);
      });
    }
  },

  /**
   * Ensures only one trigger exists for a function
   * @param {string} functionName - Function name
   * @param {number} delayMinutes - Delay in minutes
   */
  ensureSingleTrigger(functionName, delayMinutes = 1) {
    this.cleanup(functionName);
    createDelayedTrigger(functionName, delayMinutes);
    Logger.log(`Single trigger ensured for ${functionName}`);
  },

  /**
   * Creates a trigger with retry logic
   * @param {string} functionName - Function name
   * @param {number} delayMinutes - Delay in minutes (default: 2 for retry)
   */
  scheduleRetry(functionName, delayMinutes = 2) {
    this.cleanup(functionName);
    createDelayedTrigger(functionName, delayMinutes);
    Logger.log(`Retry scheduled for ${functionName} in ${delayMinutes} minute(s)`);
  },

  /**
   * Checks if function has triggers
   * @param {string} functionName - Function name
   * @returns {boolean} True if triggers exist
   */
  exists(functionName) {
    return hasTriggers(functionName);
  },

  /**
   * Gets trigger count
   * @param {string} functionName - Function name
   * @returns {number} Number of triggers
   */
  count(functionName) {
    return getTriggerCount(functionName);
  }
};
