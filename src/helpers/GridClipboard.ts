import type { Grid } from "../Grid.js";
import { BatchEditCommand } from "../commands/BatchEditCommand.js";

export function copySelection(grid: Grid): void {
  const range = grid.selection.range;
  const rows = range.maxRow - range.minRow + 1;
  const cols = range.maxCol - range.minCol + 1;
  const values: Array<Array<string | number>> = [];

  for (let r = 0; r < rows; r += 1) {
    const rowArr: Array<string | number> = [];
    for (let c = 0; c < cols; c += 1) {
      rowArr.push(grid.data.getCellValue(range.minRow + r, range.minCol + c));
    }
    values.push(rowArr);
  }

  grid.clipboard = { rows, cols, values };
}

export function pasteClipboardAt(grid: Grid, targetRow: number, targetCol: number): void {
  if (!grid.clipboard) {
    return;
  }

  const edits: { row: number; col: number; oldValue: string | number; newValue: string | number }[] = [];
  for (let r = 0; r < grid.clipboard.rows; r += 1) {
    for (let c = 0; c < grid.clipboard.cols; c += 1) {
      const destRow = targetRow + r;
      const destCol = targetCol + c;
      const newValue = grid.clipboard.values[r][c];
      const oldValue = grid.data.getCellValue(destRow, destCol);
      if (oldValue !== newValue) {
        edits.push({ row: destRow, col: destCol, oldValue: oldValue ?? "", newValue });
      }
    }
  }

  if (edits.length === 0) {
    return;
  }

  const command = new BatchEditCommand(grid.data, edits);
  grid.commandManager.execute(command);
  grid.render();
}
