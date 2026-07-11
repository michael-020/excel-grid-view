import type { Grid } from "../Grid.js";
import { EditCellCommand } from "../commands/EditCellCommand.js";
import { evaluateFormula } from "./GridFormulas.js";
import { getColumnOffset, getRowOffset, autoResizeColumnIfNeeded } from "./GridLayout.js";

export function handleEditInputChange(grid: Grid): void {
  const value = grid.editInput.value || "";
  const formulaMenu = document.getElementById("formula-menu") as HTMLDivElement | null;
  if (!formulaMenu) return;
  if (value === "=") {
    showFormulaMenuForSelection(grid);
  } else {
    hideFormulaMenu(grid);
  }
}

export function insertFormula(grid: Grid, func: string): void {
  grid.editInput.value = `=${func}()`;
  grid.editInput.focus();
  const pos = grid.editInput.value.indexOf("()");
  if (pos >= 0) {
    grid.editInput.setSelectionRange(pos + 1, pos + 1);
  }
  hideFormulaMenu(grid);
}

export function showFormulaMenuForSelection(grid: Grid): void {
  const formulaMenu = document.getElementById("formula-menu") as HTMLDivElement | null;
  if (!formulaMenu) return;
  const row = grid.selection.anchorRow;
  const col = grid.selection.anchorCol;
  const x = 60 + getColumnOffset(grid.columnDefinitions, col) - grid.scrollLeft;
  const y = 32 + getRowOffset(grid.rowDefinitions, row) - grid.scrollTop;
  const canvasRect = grid.canvas.getBoundingClientRect();
  formulaMenu.style.left = `${Math.max(8, canvasRect.left + x)}px`;
  formulaMenu.style.top = `${canvasRect.top + y + (grid.rowDefinitions[row]?.height || 24) + 6}px`;
  formulaMenu.style.display = "block";
  formulaMenu.setAttribute("aria-hidden", "false");
}

export function hideFormulaMenu(grid: Grid): void {
  const formulaMenu = document.getElementById("formula-menu") as HTMLDivElement | null;
  if (!formulaMenu) return;
  formulaMenu.style.display = "none";
  formulaMenu.setAttribute("aria-hidden", "true");
}

export function showEditInput(grid: Grid, row: number, col: number): void {
  const x = 60 + getColumnOffset(grid.columnDefinitions, col) - grid.scrollLeft;
  const y = 32 + getRowOffset(grid.rowDefinitions, row) - grid.scrollTop;
  const width = grid.columnDefinitions[col].width;
  const height = grid.rowDefinitions[row].height;

  grid.editInput.style.left = `${x}px`;
  grid.editInput.style.top = `${y}px`;
  grid.editInput.style.width = `${Math.max(0, width)}px`;
  grid.editInput.style.height = `${Math.max(0, height)}px`;
  grid.editInput.style.backgroundColor = "#ffffff";
  grid.editInput.style.border = "1px solid #93c5fd";
  grid.editInput.style.color = "#111827";
  grid.editInput.style.padding = "0 8px";
  grid.editInput.style.lineHeight = `${height}px`;
  grid.editInput.value = String(grid.data.getCellValue(row, col));
  grid.editInput.style.display = "block";
  grid.editInput.focus();
  grid.editInput.setSelectionRange(0, grid.editInput.value.length);
  grid.selection.selectCell(row, col);
  grid.render();
}

export function hideEditInput(grid: Grid): void {
  grid.editInput.style.display = "none";
  grid.canvas.focus();
}

export function handleInputKeyDown(grid: Grid, event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    applyEdit(grid, grid.editInput.value);
    hideEditInput(grid);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    hideEditInput(grid);
    return;
  }
}

export function applyEdit(grid: Grid, value: string): void {
  const row = grid.selection.anchorRow;
  const col = grid.selection.anchorCol;

  if (value.trim().startsWith("='") || value.trim().startsWith("=\"")) {
    // allow literal quoted strings after '='
  }

  if (value.trim().startsWith("=")) {
    const result = evaluateFormula(value.trim(), grid.data);
    if (result.error) {
      grid.lastFormulaError = result.error;
      grid.commandManager.execute(new EditCellCommand(grid.data, row, col, "#ERROR"));
      hideFormulaMenu(grid);
      grid.render();
      return;
    }
    const finalValue = result.value as number | string;
    const currentValue = grid.data.getCellValue(row, col);
    if (currentValue === finalValue) {
      return;
    }
    grid.commandManager.execute(new EditCellCommand(grid.data, row, col, finalValue));
    autoResizeColumnIfNeeded(grid, col, String(finalValue));
    grid.lastFormulaError = null;
    hideFormulaMenu(grid);
    grid.render();
    return;
  }

  const numericValue = value.trim() === "" ? "" : Number(value);
  const finalValue = Number.isNaN(numericValue) ? value : numericValue;
  const currentValue = grid.data.getCellValue(row, col);
  if (currentValue === finalValue) {
    return;
  }
  grid.commandManager.execute(new EditCellCommand(grid.data, row, col, finalValue));
  autoResizeColumnIfNeeded(grid, col, String(finalValue));
  grid.lastFormulaError = null;
  grid.render();
}
