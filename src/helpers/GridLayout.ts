import type { ColumnDefinition, RowDefinition } from "../models/Dimension.js";
import type { Grid } from "../Grid.js";
import { CELL_HEIGHT, CELL_WIDTH, MIN_CELL_HEIGHT, MIN_CELL_WIDTH } from "../lib/constants.js";

// this function gets the columnOffset - 
// which means it gets the vertical distance from the top of the view port to the selected column
export function getColumnOffset(columnDefinitions: ColumnDefinition[], index: number): number {
  return columnDefinitions.slice(0, index).reduce((sum, column) => sum + column.width, 0);
}

// this function gets the rowOffset - 
// which means it gets the horizontal distance from the left of the view port to the selected column
export function getRowOffset(rowDefinitions: RowDefinition[], index: number): number {
  return rowDefinitions.slice(0, index).reduce((sum, row) => sum + row.height, 0);
}

// this function gets the column index of the selected column 
export function getColumnIndexAtPosition(columnDefinitions: ColumnDefinition[], positionX: number): number {
  if (positionX < 0) {
    return 0;
  }
  let currentX = 0;
  for (let index = 0; index < columnDefinitions.length; index += 1) {
    const width = columnDefinitions[index]!.width;
    if (positionX < currentX + width) {
      return index;
    }
    currentX += width;
  }
  return -1;
}

// this function gets the row index of the selected column 
export function getRowIndexAtPosition(rowDefinitions: RowDefinition[], positionY: number): number {
  if (positionY < 0) {
    return 0;
  }
  let currentY = 0;
  for (let index = 0; index < rowDefinitions.length; index += 1) {
    const height = rowDefinitions[index]!.height;
    if (positionY < currentY + height) {
      return index;
    }
    currentY += height;
  }
  return -1;
}


// this function gets the column range visible in the viewport
export function getVisibleColumnRange(
  columnDefinitions: ColumnDefinition[],
  scrollLeft: number,
  canvasWidth: number
): { start: number; end: number } {
  const offsetX = Math.max(0, scrollLeft - CELL_WIDTH);
  let start = getColumnIndexAtPosition(columnDefinitions, offsetX);
  if (start < 0) {
    start = 0;
  }
  const viewWidth = canvasWidth - CELL_WIDTH;
  let visibleWidth = getColumnOffset(columnDefinitions, start) + columnDefinitions[start]!.width - offsetX;
  let end = start;
  while (end + 1 < columnDefinitions.length && visibleWidth < viewWidth) {
    end += 1;
    visibleWidth += columnDefinitions[end]!.width;
  }
  return { start, end };
}

// this function gets the row range visible in the viewport
export function getVisibleRowRange(
  rowDefinitions: RowDefinition[],
  scrollTop: number,
  canvasHeight: number
): { start: number; end: number } {
  const offsetY = Math.max(0, scrollTop - CELL_HEIGHT);
  let start = getRowIndexAtPosition(rowDefinitions, offsetY);
  if (start < 0) {
    start = 0;
  }
  const viewHeight = canvasHeight - CELL_HEIGHT;
  let visibleHeight = getRowOffset(rowDefinitions, start) + rowDefinitions[start]!.height - offsetY;
  let end = start;
  while (end + 1 < rowDefinitions.length && visibleHeight < viewHeight) {
    end += 1;
    visibleHeight += rowDefinitions[end]!.height;
  }
  return { start, end };
}

// this function gets the full width of the grid
export function getFullGridWidth(columnDefinitions: ColumnDefinition[]): number {
  return CELL_WIDTH + columnDefinitions.reduce((sum, column) => sum + column.width, 0);
}


// this function gets the full height of the grid
export function getFullGridHeight(rowDefinitions: RowDefinition[]): number {
  return CELL_HEIGHT + rowDefinitions.reduce((sum, row) => sum + row.height, 0);
}

// this functions update the size of the spacer
export function updateSpacerSize(grid: Grid): void {
  grid.spacer.style.width = `${getFullGridWidth(grid.columnDefinitions)}px`;
  grid.spacer.style.height = `${getFullGridHeight(grid.rowDefinitions)}px`;
}

// this function ensures cell visiblitiy in the view port - 
// if user navigates out of the viewport using arrow keys, this function ensures 
// that the viewport gets shifted and the selected cell is visible
export function ensureCellVisible(grid: Grid, row: number, col: number): void {
  const x = getColumnOffset(grid.columnDefinitions, col);
  const y = getRowOffset(grid.rowDefinitions, row);
  const left = Math.max(0, x - 20);
  const top = Math.max(0, y - 20);
  window.scrollTo({ left, top, behavior: "smooth" });
}

// this function is used to resize column automatically when the content inside a cell takes up more width than the width of the cell itself
export function autoResizeColumnIfNeeded(grid: Grid, colIndex: number, value: string): void {
  const textWidth = grid.context.measureText(value).width;
  const requiredWidth = Math.ceil(textWidth + 16);
  grid.columnDefinitions[colIndex]!.width = Math.max(grid.columnDefinitions[colIndex]!.width, requiredWidth, MIN_CELL_WIDTH);
  updateSpacerSize(grid);
}

// this function is used to resize column to take up the width of the max width of the content inside of the cells in that column
// if double clicked on its respective column header 
export function autoResizeColumn(grid: Grid, colIndex: number): void {
  const headerWidth = grid.context.measureText(grid.columnDefinitions[colIndex]!.label).width;
  let maxWidth = headerWidth;
  grid.data.getEntries().forEach((entry) => {
    if (entry.col !== colIndex) {
      return;
    }
    const width = grid.context.measureText(String(entry.value)).width;
    if (width > maxWidth) {
      maxWidth = width;
    }
  });
  grid.columnDefinitions[colIndex]!.width = Math.max(MIN_CELL_WIDTH, Math.ceil(maxWidth + 16));
  updateSpacerSize(grid);
  grid.render();
}

// this function is used to resize row to take up the height of the max height of the content inside of the cells in that column
// if double clicked on its respective row header 
export function autoResizeRow(grid: Grid, rowIndex: number): void {
  let maxHeight = MIN_CELL_HEIGHT;
  grid.data.getEntries().forEach((entry) => {
    if (entry.row !== rowIndex) {
      return;
    }
    const metrics = grid.context.measureText(String(entry.value));
    const contentHeight = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 12);
    if (contentHeight > maxHeight) {
      maxHeight = contentHeight;
    }
  });
  grid.rowDefinitions[rowIndex]!.height = Math.max(MIN_CELL_HEIGHT, maxHeight);
  updateSpacerSize(grid);
  grid.render();
}
