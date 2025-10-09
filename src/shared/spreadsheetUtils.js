/**
 * Spreadsheet utilities for Google Apps Script
 *
 * Provides reusable functions for opening and managing spreadsheets.
 * Requires: config.js (for source and target configurations)
 */

/**
 * Opens source and target spreadsheets
 * @param {string} sourceId - Source spreadsheet ID
 * @param {Array} targetConfigs - Array of target spreadsheet configurations [{id, name}, ...]
 * @returns {Object} { source: Spreadsheet, targets: [{name, spreadsheet}, ...] }
 */
function openSpreadsheets(sourceId, targetConfigs) {
  const source = SpreadsheetApp.openById(sourceId);
  const targets = targetConfigs.map(target => ({
    name: target.name,
    spreadsheet: SpreadsheetApp.openById(target.id)
  }));

  return { source, targets };
}

/**
 * Opens source and target spreadsheets using config.js settings
 * @returns {Object} { source: Spreadsheet, targets: [{name, spreadsheet}, ...] }
 */
function openSourceAndTargets() {
  const sourceConfig = getSourceSpreadsheet();
  const targetConfigs = getTargetSpreadsheets();

  return openSpreadsheets(sourceConfig.id, targetConfigs);
}

/**
 * Gets a sheet by name with error handling
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to get
 * @returns {Sheet|null} Sheet object or null if not found
 */
function getSheetSafe(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(`Sheet "${sheetName}" not found in spreadsheet: ${spreadsheet.getName()}`);
      return null;
    }
    return sheet;
  } catch (error) {
    Logger.log(`Error getting sheet "${sheetName}": ${error.message}`);
    return null;
  }
}

/**
 * Gets all sheet names from a spreadsheet
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @returns {Array<string>} Array of sheet names
 */
function getAllSheetNames(spreadsheet) {
  return spreadsheet.getSheets().map(sheet => sheet.getName());
}

/**
 * Checks if a spreadsheet has a specific sheet
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to check
 * @returns {boolean} True if sheet exists
 */
function hasSheet(spreadsheet, sheetName) {
  return getSheetSafe(spreadsheet, sheetName) !== null;
}
