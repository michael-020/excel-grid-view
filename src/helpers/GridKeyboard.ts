import type { Grid } from "../Grid.js";
import { showEditInput } from "./GridEditor.js";

export function handleKeyDown(grid: Grid, event: KeyboardEvent): void {
  const isCopy = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "c";
  const isPaste = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "v";

  if (isCopy) {
    event.preventDefault();
    grid.copySelection();
    return;
  }

  if (isPaste) {
    event.preventDefault();
    grid.pasteClipboardAt(grid.selection.anchorRow, grid.selection.anchorCol);
    return;
  }

  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)) {
    return;
  }

  if (event.key.startsWith("Arrow")) {
    if (grid.editInput.style.display === "block" || document.activeElement === grid.editInput) {
      return;
    }
    event.preventDefault();
    navigateByKey(grid, event.key);
    return;
  }

  if (event.key === "Enter" && grid.editInput.style.display === "none") {
    event.preventDefault();
    showEditInput(grid, grid.selection.anchorRow, grid.selection.anchorCol);
  }
}

export function navigateByKey(grid: Grid, key: string): void {
  let row = grid.selection.anchorRow;
  let col = grid.selection.anchorCol;

  switch (key) {
    case "ArrowUp":
      row = Math.max(0, row - 1);
      break;
    case "ArrowDown":
      row = Math.min(grid.rowDefinitions.length - 1, row + 1);
      break;
    case "ArrowLeft":
      col = Math.max(0, col - 1);
      break;
    case "ArrowRight":
      col = Math.min(grid.columnDefinitions.length - 1, col + 1);
      break;
    default:
      return;
  }

  grid.selection.selectCell(row, col);
  ensureCellVisible(grid, row, col);
  grid.hideFormulaMenu();
  grid.render();
}

export function ensureCellVisible(grid: Grid, row: number, col: number): void {
  const x = grid.columnDefinitions.slice(0, col).reduce((sum, column) => sum + column.width, 0);
  const y = grid.rowDefinitions.slice(0, row).reduce((sum, rowDef) => sum + rowDef.height, 0);
  const left = Math.max(0, x - 20);
  const top = Math.max(0, y - 20);
  window.scrollTo({ left, top, behavior: "smooth" });
}
