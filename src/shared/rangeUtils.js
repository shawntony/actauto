/**
 * Range utilities for Google Apps Script
 *
 * Provides reusable functions for getting and setting range data with formatting.
 */

/**
 * Gets complete row data including all formatting
 * @param {Sheet} sheet - The sheet to read from
 * @param {number} rowNumber - The row number to read (1-indexed)
 * @returns {Object|null} Row data object with values and formatting, or null if row is empty
 * @property {Array<Array>} values - Cell values
 * @property {Array<Array>} formats - Number formats
 * @property {Array<Array>} fontWeights - Font weights (bold, normal)
 * @property {Array<Array>} fontColors - Font colors
 * @property {Array<Array>} backgrounds - Background colors
 * @property {Array<Array>} horizontalAlignments - Horizontal alignments
 * @property {number} columnCount - Number of columns
 */
function getCompleteRowData(sheet, rowNumber) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    Logger.log(`Row ${rowNumber} is empty in sheet: ${sheet.getName()}`);
    return null;
  }

  const range = sheet.getRange(rowNumber, 1, 1, lastColumn);

  return {
    values: range.getValues(),
    formats: range.getNumberFormats(),
    fontWeights: range.getFontWeights(),
    fontColors: range.getFontColors(),
    backgrounds: range.getBackgrounds(),
    horizontalAlignments: range.getHorizontalAlignments(),
    columnCount: lastColumn
  };
}

/**
 * Sets complete row data including all formatting
 * @param {Sheet} targetSheet - The sheet to write to
 * @param {number} rowNumber - The row number to write (1-indexed)
 * @param {Object} rowData - Row data object from getCompleteRowData()
 */
function setCompleteRowData(targetSheet, rowNumber, rowData) {
  if (!rowData || rowData.columnCount === 0) {
    Logger.log(`No data to set for row ${rowNumber}`);
    return;
  }

  const targetRange = targetSheet.getRange(rowNumber, 1, 1, rowData.columnCount);

  targetRange.setValues(rowData.values);
  targetRange.setNumberFormats(rowData.formats);
  targetRange.setFontWeights(rowData.fontWeights);
  targetRange.setFontColors(rowData.fontColors);
  targetRange.setBackgrounds(rowData.backgrounds);
  targetRange.setHorizontalAlignments(rowData.horizontalAlignments);
}

/**
 * Copies complete row data from one sheet to another with all formatting
 * @param {Sheet} sourceSheet - The sheet to copy from
 * @param {Sheet} targetSheet - The sheet to copy to
 * @param {number} rowNumber - The row number to copy (1-indexed)
 * @returns {boolean} True if successful, false if row was empty
 */
function copyCompleteRow(sourceSheet, targetSheet, rowNumber) {
  const rowData = getCompleteRowData(sourceSheet, rowNumber);

  if (!rowData) {
    return false;
  }

  setCompleteRowData(targetSheet, rowNumber, rowData);
  return true;
}

/**
 * Gets multiple rows of data with formatting
 * @param {Sheet} sheet - The sheet to read from
 * @param {number} startRow - Starting row number (1-indexed)
 * @param {number} numRows - Number of rows to read
 * @returns {Object|null} Multi-row data object, or null if empty
 */
function getCompleteRowsData(sheet, startRow, numRows) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    Logger.log(`Sheet is empty: ${sheet.getName()}`);
    return null;
  }

  const range = sheet.getRange(startRow, 1, numRows, lastColumn);

  return {
    values: range.getValues(),
    formats: range.getNumberFormats(),
    fontWeights: range.getFontWeights(),
    fontColors: range.getFontColors(),
    backgrounds: range.getBackgrounds(),
    horizontalAlignments: range.getHorizontalAlignments(),
    columnCount: lastColumn,
    rowCount: numRows
  };
}

/**
 * Sets multiple rows of data with formatting
 * @param {Sheet} targetSheet - The sheet to write to
 * @param {number} startRow - Starting row number (1-indexed)
 * @param {Object} rowsData - Multi-row data object from getCompleteRowsData()
 */
function setCompleteRowsData(targetSheet, startRow, rowsData) {
  if (!rowsData || rowsData.columnCount === 0) {
    Logger.log(`No data to set starting at row ${startRow}`);
    return;
  }

  const targetRange = targetSheet.getRange(startRow, 1, rowsData.rowCount, rowsData.columnCount);

  targetRange.setValues(rowsData.values);
  targetRange.setNumberFormats(rowsData.formats);
  targetRange.setFontWeights(rowsData.fontWeights);
  targetRange.setFontColors(rowsData.fontColors);
  targetRange.setBackgrounds(rowsData.backgrounds);
  targetRange.setHorizontalAlignments(rowsData.horizontalAlignments);
}
