import type { Grid } from "../Grid.js";
import { getColumnIndexAtPosition, getRowIndexAtPosition } from "./GridLayout.js";
import { showEditInput, hideFormulaMenu } from "./GridEditor.js";
import { CELL_HEIGHT, CELL_WIDTH } from "../lib/constants.js";

// this function handles all the actions to be done when the double-click event is triggered
export function handleDoubleClick(grid: Grid, event: MouseEvent): void {
  const contentX = event.offsetX + window.pageXOffset;
  const contentY = event.offsetY + window.pageYOffset;

  const row = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
  const col = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
  if (row >= 0 && col >= 0) {
    hideFormulaMenu();
    showEditInput(grid, row, col);
  }
}
