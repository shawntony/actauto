/**
 * Sheet management utilities for Google Apps Script
 *
 * Provides reusable functions for creating, deleting, and managing sheets.
 * Requires: spreadsheetUtils.js, delayUtils.js
 */

/**
 * Gets a sheet, creating it if it doesn't exist
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} Sheet object (existing or newly created)
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Creating sheet: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
    DelayUtils.afterSheetCreation(); // Wait for sheet to be fully created
  }

  return sheet;
}

/**
 * Creates a sheet only if it doesn't already exist
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet|null} Newly created sheet or null if already exists
 */
function createSheetIfNotExists(spreadsheet, sheetName) {
  const existingSheet = spreadsheet.getSheetByName(sheetName);

  if (existingSheet) {
    Logger.log(`Sheet already exists: ${sheetName}`);
    return null;
  }

  Logger.log(`Creating new sheet: ${sheetName}`);
  const sheet = spreadsheet.insertSheet(sheetName);
  DelayUtils.afterSheetCreation();

  return sheet;
}

/**
 * Deletes a sheet if it exists
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to delete
 * @returns {boolean} True if deleted, false if didn't exist
 */
function deleteSheetIfExists(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet doesn't exist: ${sheetName}`);
    return false;
  }

  Logger.log(`Deleting sheet: ${sheetName}`);
  spreadsheet.deleteSheet(sheet);
  return true;
}

/**
 * Clears all content from a sheet
 * @param {Sheet} sheet - The sheet to clear
 * @param {boolean} preserveHeaders - If true, keeps row 1 intact (default: false)
 */
function clearSheetContent(sheet, preserveHeaders = false) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    Logger.log(`Sheet is already empty: ${sheet.getName()}`);
    return;
  }

  if (preserveHeaders && lastRow > 1) {
    // Clear from row 2 onwards
    sheet.getRange(2, 1, lastRow - 1, lastColumn).clear();
    Logger.log(`Cleared content (preserved headers): ${sheet.getName()}`);
  } else {
    // Clear everything
    sheet.clear();
    Logger.log(`Cleared all content: ${sheet.getName()}`);
  }
}

/**
 * Copies a sheet within the same spreadsheet
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sourceSheetName - Name of the sheet to copy
 * @param {string} newSheetName - Name for the new copy
 * @returns {Sheet|null} New sheet or null if source doesn't exist
 */
function duplicateSheet(spreadsheet, sourceSheetName, newSheetName) {
  const sourceSheet = spreadsheet.getSheetByName(sourceSheetName);

  if (!sourceSheet) {
    Logger.log(`Source sheet not found: ${sourceSheetName}`);
    return null;
  }

  // Delete target sheet if it already exists
  deleteSheetIfExists(spreadsheet, newSheetName);

  Logger.log(`Duplicating ${sourceSheetName} to ${newSheetName}`);
  const newSheet = sourceSheet.copyTo(spreadsheet);
  newSheet.setName(newSheetName);
  DelayUtils.afterSheetCreation();

  return newSheet;
}

/**
 * Ensures a sheet exists with specific structure (row 1 headers)
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet
 * @param {Array<string>} headers - Array of header names for row 1
 * @returns {Sheet} Sheet object with headers set
 */
function ensureSheetWithHeaders(spreadsheet, sheetName, headers) {
  const sheet = getOrCreateSheet(spreadsheet, sheetName);

  // Check if headers are already set
  const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMatch = headers.every((header, index) => existingHeaders[index] === header);

  if (!headersMatch) {
    Logger.log(`Setting headers for: ${sheetName}`);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Optional: Make headers bold
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  return sheet;
}

/**
 * Renames a sheet if it exists
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} oldName - Current sheet name
 * @param {string} newName - New sheet name
 * @returns {boolean} True if renamed, false if sheet doesn't exist
 */
function renameSheet(spreadsheet, oldName, newName) {
  const sheet = spreadsheet.getSheetByName(oldName);

  if (!sheet) {
    Logger.log(`Sheet not found: ${oldName}`);
    return false;
  }

  // Check if target name already exists
  const targetSheet = spreadsheet.getSheetByName(newName);
  if (targetSheet) {
    Logger.log(`Target name already exists: ${newName}`);
    return false;
  }

  Logger.log(`Renaming sheet: ${oldName} → ${newName}`);
  sheet.setName(newName);
  return true;
}

/**
 * Hides a sheet
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to hide
 * @returns {boolean} True if hidden, false if sheet doesn't exist
 */
function hideSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet not found: ${sheetName}`);
    return false;
  }

  sheet.hideSheet();
  Logger.log(`Hidden sheet: ${sheetName}`);
  return true;
}

/**
 * Shows (unhides) a sheet
 * @param {Spreadsheet} spreadsheet - The spreadsheet object
 * @param {string} sheetName - Name of the sheet to show
 * @returns {boolean} True if shown, false if sheet doesn't exist
 */
function showSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet not found: ${sheetName}`);
    return false;
  }

  sheet.showSheet();
  Logger.log(`Shown sheet: ${sheetName}`);
  return true;
}
