import type { Grid } from "../Grid.js";
import { getColumnIndexAtPosition, getRowIndexAtPosition, getColumnOffset, getRowOffset } from "./GridLayout.js";
import { showEditInput, hideFormulaMenu } from "./GridEditor.js";
import { autoResizeColumn, autoResizeRow } from "./GridLayout.js";

export function handleDoubleClick(grid: Grid, event: MouseEvent): void {
  const contentX = event.offsetX + window.pageXOffset;
  const contentY = event.offsetY + window.pageYOffset;

  if (contentY <= 32 && contentX > 60) {
    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - 60);
    if (colIndex >= 0) {
      const columnStartCanvasX = 60 + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
      const localX = event.offsetX - columnStartCanvasX;
      const width = grid.columnDefinitions[colIndex].width;
      const nearEdge = Math.abs(localX - width) <= 6;
      if (nearEdge) {
        autoResizeColumn(grid, colIndex);
      } else {
        grid.selection.selectColumn(colIndex);
        hideFormulaMenu(grid);
        grid.render();
      }
    }
    return;
  }

  if (contentX <= 60 && contentY > 32) {
    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - 32);
    if (rowIndex >= 0) {
      const rowStartCanvasY = 32 + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
      const localY = event.offsetY - rowStartCanvasY;
      const height = grid.rowDefinitions[rowIndex].height;
      const nearEdge = Math.abs(localY - height) <= 6;
      if (nearEdge) {
        autoResizeRow(grid, rowIndex);
      } else {
        grid.selection.selectRow(rowIndex);
        hideFormulaMenu(grid);
        grid.render();
      }
    }
    return;
  }

  const row = getRowIndexAtPosition(grid.rowDefinitions, contentY - 32);
  const col = getColumnIndexAtPosition(grid.columnDefinitions, contentX - 60);
  if (row >= 0 && col >= 0) {
    hideFormulaMenu(grid);
    showEditInput(grid, row, col);
  }
}
