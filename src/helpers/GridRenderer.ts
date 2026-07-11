import type { Grid } from "../Grid.js";
import { getColumnOffset, getRowOffset, getVisibleColumnRange, getVisibleRowRange } from "./GridLayout.js";

function clearCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function renderHeaders(grid: Grid): void {
  const { context, canvas, columnDefinitions, rowDefinitions, scrollLeft, scrollTop } = grid;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  context.fillStyle = "#9ca3af";
  context.fillRect(0, 0, width, 32);
  context.fillRect(0, 0, 60, height);

  context.strokeStyle = "rgba(0,0,0,0.15)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(60.5, 32.5);
  context.lineTo(60.5, height + 0.5);
  context.moveTo(60.5, 32.5);
  context.lineTo(width + 0.5, 32.5);

  const visibleColumnsForLines = getVisibleColumnRange(columnDefinitions, scrollLeft, width);
  let headerX = 60 + getColumnOffset(columnDefinitions, visibleColumnsForLines.start) - scrollLeft;
  for (let colIndex = visibleColumnsForLines.start; colIndex <= visibleColumnsForLines.end; colIndex += 1) {
    headerX += columnDefinitions[colIndex].width;
    context.moveTo(headerX + 0.5, 0.5);
    context.lineTo(headerX + 0.5, 32.5);
  }

  const visibleRowsForLines = getVisibleRowRange(rowDefinitions, scrollTop, height);
  let headerY = 32 + getRowOffset(rowDefinitions, visibleRowsForLines.start) - scrollTop;
  for (let rowIndex = visibleRowsForLines.start; rowIndex <= visibleRowsForLines.end; rowIndex += 1) {
    headerY += rowDefinitions[rowIndex].height;
    context.moveTo(0.5, headerY + 0.5);
    context.lineTo(60.5, headerY + 0.5);
  }

  context.stroke();

  context.fillStyle = "#000000";
  context.font = "600 12px ui-sans-serif, system-ui";
  context.textBaseline = "middle";
  context.textAlign = "center";

  const visibleColumns = getVisibleColumnRange(columnDefinitions, scrollLeft, width);
  context.save();
  context.beginPath();
  context.rect(60, 0, width - 60, 32);
  context.clip();
  for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
    const x = 60 + getColumnOffset(columnDefinitions, colIndex) - scrollLeft;
    const columnWidth = columnDefinitions[colIndex].width;
    const center = x + columnWidth / 2;
    context.fillText(columnDefinitions[colIndex].label, center, 32 / 2);
  }
  context.restore();

  const visibleRows = getVisibleRowRange(rowDefinitions, scrollTop, height);
  context.save();
  context.beginPath();
  context.rect(0, 32, 60, height - 32);
  context.clip();
  for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
    const y = 32 + getRowOffset(rowDefinitions, rowIndex) - scrollTop;
    const rowHeight = rowDefinitions[rowIndex].height;
    const center = y + rowHeight / 2;
    context.fillText(rowDefinitions[rowIndex].label, 60 / 2, center);
  }
  context.restore();

  // Corner cell is drawn last so scrolling headers pass behind it.
  context.fillStyle = "#9ca3af";
  context.fillRect(0, 0, 60, 32);
  context.strokeStyle = "rgba(0,0,0,0.15)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(60.5, 0.5);
  context.lineTo(60.5, 32.5);
  context.moveTo(0.5, 32.5);
  context.lineTo(60.5, 32.5);
  context.stroke();
}

function renderGridLines(grid: Grid): void {
  const { context, canvas, columnDefinitions, rowDefinitions, scrollLeft, scrollTop } = grid;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  context.strokeStyle = "rgba(148,163,184,0.16)";
  context.lineWidth = 1;

  const visibleColumns = getVisibleColumnRange(columnDefinitions, scrollLeft, width);
  let x = 60 + getColumnOffset(columnDefinitions, visibleColumns.start) - scrollLeft;
  for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
    x += columnDefinitions[colIndex].width;
    context.beginPath();
    context.moveTo(x + 0.5, 32.5);
    context.lineTo(x + 0.5, height + 0.5);
    context.stroke();
  }

  const visibleRows = getVisibleRowRange(rowDefinitions, scrollTop, height);
  let y = 32 + getRowOffset(rowDefinitions, visibleRows.start) - scrollTop;
  for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
    y += rowDefinitions[rowIndex].height;
    context.beginPath();
    context.moveTo(60.5, y + 0.5);
    context.lineTo(width + 0.5, y + 0.5);
    context.stroke();
  }
}

function renderCells(grid: Grid): void {
  const { context, canvas, columnDefinitions, rowDefinitions, data, scrollLeft, scrollTop } = grid;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const visibleColumns = getVisibleColumnRange(columnDefinitions, scrollLeft, width);
  const visibleRows = getVisibleRowRange(rowDefinitions, scrollTop, height);

  context.fillStyle = "#000000";
  context.font = "13px ui-sans-serif, system-ui";
  context.textBaseline = "middle";
  context.textAlign = "left";

  for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
    const row = rowDefinitions[rowIndex];
    const y = 32 + getRowOffset(rowDefinitions, rowIndex) - scrollTop;
    for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
      const x = 60 + getColumnOffset(columnDefinitions, colIndex) - scrollLeft;
      const value = data.getCellValue(row.index, columnDefinitions[colIndex].index);
      const displayValue = value === "" ? "" : String(value);
      context.fillText(displayValue, x + 8, y + row.height / 2);
    }
  }
}

function renderSelection(grid: Grid): void {
  const { context, columnDefinitions, rowDefinitions, scrollLeft, scrollTop, selection } = grid;
  const range = selection.range;
  const startX = 60 + getColumnOffset(columnDefinitions, range.minCol) - scrollLeft;
  const startY = 32 + getRowOffset(rowDefinitions, range.minRow) - scrollTop;
  const width = columnDefinitions.slice(range.minCol, range.maxCol + 1).reduce((sum, column) => sum + column.width, 0);
  const height = rowDefinitions.slice(range.minRow, range.maxRow + 1).reduce((sum, row) => sum + row.height, 0);

  context.fillStyle = "rgba(59,130,246,0.2)";
  context.fillRect(startX, startY, width, height);

  context.strokeStyle = "rgba(59,130,246,0.85)";
  context.lineWidth = 2;
  context.strokeRect(startX + 0.5, startY + 0.5, width - 1, height - 1);
}

function updateSummaryBar(grid: Grid): void {
  const summary = grid.selection.getSummary(grid.data);
  const text = grid.lastFormulaError
    ? `ERROR: ${grid.lastFormulaError}`
    : `Count: ${summary.count} • Sum: ${summary.sumString} • Min: ${summary.minString} • Max: ${summary.maxString} • Avg: ${summary.avgString}`;
  if (grid.summaryBar) {
    grid.summaryBar.textContent = text;
  }
}

export function updateEditInputPosition(grid: Grid): void {
  if (grid.editInput.style.display !== "block") {
    return;
  }

  const row = grid.selection.anchorRow;
  const col = grid.selection.anchorCol;
  const x = 60 + getColumnOffset(grid.columnDefinitions, col) - grid.scrollLeft;
  const y = 32 + getRowOffset(grid.rowDefinitions, row) - grid.scrollTop;
  const width = grid.columnDefinitions[col].width;
  const height = grid.rowDefinitions[row].height;

  const isVisible = x + width > 0 && x < grid.canvas.clientWidth && y + height > 0 && y < grid.canvas.clientHeight;
  if (!isVisible) {
    grid.editInput.style.display = "none";
    grid.canvas.focus();
    return;
  }

  grid.editInput.style.left = `${x}px`;
  grid.editInput.style.top = `${y}px`;
  grid.editInput.style.width = `${Math.max(0, width)}px`;
  grid.editInput.style.height = `${Math.max(0, height)}px`;
}

export function renderGrid(grid: Grid): void {
  grid.scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
  grid.scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
  clearCanvas(grid.context, grid.canvas);
  renderGridLines(grid);
  renderCells(grid);
  renderSelection(grid);
  renderHeaders(grid);
  updateEditInputPosition(grid);
  updateSummaryBar(grid);
}
