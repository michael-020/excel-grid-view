import type { ColumnDefinition, RowDefinition } from "../models/Dimension.js";
import type { Grid } from "../Grid.js";

export function getColumnOffset(columnDefinitions: ColumnDefinition[], index: number): number {
  return columnDefinitions.slice(0, index).reduce((sum, column) => sum + column.width, 0);
}

export function getRowOffset(rowDefinitions: RowDefinition[], index: number): number {
  return rowDefinitions.slice(0, index).reduce((sum, row) => sum + row.height, 0);
}

export function getColumnIndexAtPosition(columnDefinitions: ColumnDefinition[], positionX: number): number {
  if (positionX < 0) {
    return 0;
  }
  let currentX = 0;
  for (let index = 0; index < columnDefinitions.length; index += 1) {
    const width = columnDefinitions[index].width;
    if (positionX < currentX + width) {
      return index;
    }
    currentX += width;
  }
  return -1;
}

export function getRowIndexAtPosition(rowDefinitions: RowDefinition[], positionY: number): number {
  if (positionY < 0) {
    return 0;
  }
  let currentY = 0;
  for (let index = 0; index < rowDefinitions.length; index += 1) {
    const height = rowDefinitions[index].height;
    if (positionY < currentY + height) {
      return index;
    }
    currentY += height;
  }
  return -1;
}

export function getVisibleColumnRange(
  columnDefinitions: ColumnDefinition[],
  scrollLeft: number,
  canvasWidth: number
): { start: number; end: number } {
  const offsetX = Math.max(0, scrollLeft - 60);
  let start = getColumnIndexAtPosition(columnDefinitions, offsetX);
  if (start < 0) {
    start = 0;
  }
  const viewWidth = canvasWidth - 60;
  let visibleWidth = getColumnOffset(columnDefinitions, start) + columnDefinitions[start].width - offsetX;
  let end = start;
  while (end + 1 < columnDefinitions.length && visibleWidth < viewWidth) {
    end += 1;
    visibleWidth += columnDefinitions[end].width;
  }
  return { start, end };
}

export function getVisibleRowRange(
  rowDefinitions: RowDefinition[],
  scrollTop: number,
  canvasHeight: number
): { start: number; end: number } {
  const offsetY = Math.max(0, scrollTop - 32);
  let start = getRowIndexAtPosition(rowDefinitions, offsetY);
  if (start < 0) {
    start = 0;
  }
  const viewHeight = canvasHeight - 32;
  let visibleHeight = getRowOffset(rowDefinitions, start) + rowDefinitions[start].height - offsetY;
  let end = start;
  while (end + 1 < rowDefinitions.length && visibleHeight < viewHeight) {
    end += 1;
    visibleHeight += rowDefinitions[end].height;
  }
  return { start, end };
}

export function getFullGridWidth(columnDefinitions: ColumnDefinition[]): number {
  return 60 + columnDefinitions.reduce((sum, column) => sum + column.width, 0);
}

export function getFullGridHeight(rowDefinitions: RowDefinition[]): number {
  return 32 + rowDefinitions.reduce((sum, row) => sum + row.height, 0);
}

export function updateSpacerSize(grid: Grid): void {
  grid.spacer.style.width = `${getFullGridWidth(grid.columnDefinitions)}px`;
  grid.spacer.style.height = `${getFullGridHeight(grid.rowDefinitions)}px`;
}

export function ensureCellVisible(grid: Grid, row: number, col: number): void {
  const x = getColumnOffset(grid.columnDefinitions, col);
  const y = getRowOffset(grid.rowDefinitions, row);
  const left = Math.max(0, x - 20);
  const top = Math.max(0, y - 20);
  window.scrollTo({ left, top, behavior: "smooth" });
}

export function autoResizeColumnIfNeeded(grid: Grid, colIndex: number, value: string): void {
  const textWidth = grid.context.measureText(value).width;
  const requiredWidth = Math.ceil(textWidth + 16);
  grid.columnDefinitions[colIndex].width = Math.max(grid.columnDefinitions[colIndex].width, requiredWidth, 40);
  updateSpacerSize(grid);
}

export function autoResizeColumn(grid: Grid, colIndex: number): void {
  const headerWidth = grid.context.measureText(grid.columnDefinitions[colIndex].label).width;
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
  grid.columnDefinitions[colIndex].width = Math.max(40, Math.ceil(maxWidth + 16));
  updateSpacerSize(grid);
  grid.render();
}

export function autoResizeRow(grid: Grid, rowIndex: number): void {
  let maxHeight = 24;
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
  grid.rowDefinitions[rowIndex].height = Math.max(24, maxHeight);
  updateSpacerSize(grid);
  grid.render();
}
