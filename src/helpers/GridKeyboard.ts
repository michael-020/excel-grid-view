import type { Grid } from "../Grid.js";
import { showEditInput } from "./GridEditor.js";
import { ensureCellVisible } from "./GridLayout.js";

// this function handles all the actions to be done when a key-down event is triggered
export function handleKeyDown(grid: Grid, event: KeyboardEvent): void {
  const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
  const isRedo = (event.ctrlKey || event.metaKey) && (event.shiftKey && event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y");
  const isCopy = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "c";
  const isPaste = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "v";

  if (isUndo) {
    event.preventDefault();
    if (grid.canUndo()) {
      grid.undo();
    }
    return;
  }

  if (isRedo) {
    event.preventDefault();
    if (grid.canRedo()) {
      grid.redo();
    }
    return;
  }

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

// this function handles navigation inside of a grid using arrow keys
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
