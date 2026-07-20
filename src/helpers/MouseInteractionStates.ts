import type { Grid } from "../Grid.js";
import { ResizeColumnCommand } from "../commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "../commands/ResizeRowCommand.js";
import { CELL_HEIGHT, CELL_WIDTH, MIN_CELL_HEIGHT, MIN_CELL_WIDTH } from "../lib/constants.js";
import { hideFormulaMenu } from "./GridEditor.js";
import {
  autoResizeColumn,
  autoResizeRow,
  getColumnIndexAtPosition,
  getColumnOffset,
  getRowIndexAtPosition,
  getRowOffset,
  updateSpacerSize,
} from "./GridLayout.js";

export interface MouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean;
  pointerMoveHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean;
  pointerUpHandler(grid: Grid): boolean;
}

class BaseMouseInteractionState implements MouseInteractionState {
  pointerDownHandler(_grid: Grid, _event: PointerEvent, _contentX: number, _contentY: number): boolean {
    return false;
  }

  pointerMoveHandler(_grid: Grid, _event: PointerEvent, _contentX: number, _contentY: number): boolean {
    return false;
  }

  pointerUpHandler(_grid: Grid): boolean {
    return false;
  }
}

export class ColResizeState extends BaseMouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (contentY > CELL_HEIGHT) {
      return false;
    }

    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
    if (colIndex < 0) {
      return false;
    }

    const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
    const localX = event.offsetX - columnStartCanvasX;
    const width = grid.columnDefinitions[colIndex]!.width;
    const nearEdge = Math.abs(localX - width) <= 6;

    if (!nearEdge) {
      return false;
    }

    grid.isDraggingColumn = true;
    grid.activeResizeIndex = colIndex;
    grid.startDragPosition = event.offsetX;
    grid.startSize = grid.columnDefinitions[colIndex]!.width;
    return true;
  }

  pointerMoveHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (grid.isDraggingColumn && grid.activeResizeIndex >= 0) {
      const delta = event.offsetX - grid.startDragPosition;
      const newWidth = Math.max(MIN_CELL_WIDTH, grid.startSize + delta);
      grid.columnDefinitions[grid.activeResizeIndex]!.width = newWidth;
      updateSpacerSize(grid);
      grid.render();
      return true;
    }

    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
    if (contentY <= CELL_HEIGHT && colIndex >= 0) {
      const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
      const localX = event.offsetX - columnStartCanvasX;
      const width = grid.columnDefinitions[colIndex]!.width;
      const nearEdge = Math.abs(localX - width) <= 5;
      grid.canvas.style.cursor = nearEdge ? "col-resize" : "default";
      return true;
    }

    grid.canvas.style.cursor = "default";
    return false;
  }

  pointerUpHandler(grid: Grid): boolean {
    if (!grid.isDraggingColumn || grid.activeResizeIndex < 0) {
      return false;
    }

    const finalWidth = grid.columnDefinitions[grid.activeResizeIndex]!.width;
    if (finalWidth !== grid.startSize) {
      grid.commandManager.execute(new ResizeColumnCommand(grid.columnDefinitions[grid.activeResizeIndex]!, grid.startSize, finalWidth));
    }

    grid.isDraggingColumn = false;
    grid.activeResizeIndex = -1;
    grid.startDragPosition = 0;
    grid.startSize = 0;
    return true;
  }
}

export class RowResizeState extends BaseMouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (contentX > CELL_WIDTH) {
      return false;
    }

    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
    if (rowIndex < 0) {
      return false;
    }

    const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
    const localY = event.offsetY - rowStartCanvasY;
    const height = grid.rowDefinitions[rowIndex]!.height;
    const nearEdge = Math.abs(localY - height) <= 6;

    if (!nearEdge) {
      return false;
    }

    grid.isDraggingRow = true;
    grid.activeResizeIndex = rowIndex;
    grid.startDragPosition = event.offsetY;
    grid.startSize = grid.rowDefinitions[rowIndex]!.height;
    return true;
  }

  pointerMoveHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (grid.isDraggingRow && grid.activeResizeIndex >= 0) {
      const delta = event.offsetY - grid.startDragPosition;
      const newHeight = Math.max(MIN_CELL_HEIGHT, grid.startSize + delta);
      grid.rowDefinitions[grid.activeResizeIndex]!.height = newHeight;
      updateSpacerSize(grid);
      grid.render();
      return true;
    }

    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
    if (contentX <= CELL_WIDTH && rowIndex >= 0) {
      const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
      const localY = event.offsetY - rowStartCanvasY;
      const height = grid.rowDefinitions[rowIndex]!.height;
      const nearEdge = Math.abs(localY - height) <= 5;
      grid.canvas.style.cursor = nearEdge ? "row-resize" : "default";
      return false;
    }

    grid.canvas.style.cursor = "default";
    return false;
  }

  pointerUpHandler(grid: Grid): boolean {
    if (!grid.isDraggingRow || grid.activeResizeIndex < 0) {
      return false;
    }

    const finalHeight = grid.rowDefinitions[grid.activeResizeIndex]!.height;
    if (finalHeight !== grid.startSize) {
      grid.commandManager.execute(new ResizeRowCommand(grid.rowDefinitions[grid.activeResizeIndex]!, grid.startSize, finalHeight));
    }

    grid.isDraggingRow = false;
    grid.activeResizeIndex = -1;
    grid.startDragPosition = 0;
    grid.startSize = 0;
    return true;
  }
}

export class ColSelectionState extends BaseMouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (contentY > CELL_HEIGHT || contentX <= CELL_WIDTH) {
      return false;
    }

    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
    if (colIndex < 0) {
      return false;
    }

    const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
    const localX = event.offsetX - columnStartCanvasX;
    const width = grid.columnDefinitions[colIndex]!.width;
    const nearEdge = Math.abs(localX - width) <= 6;

    if (nearEdge) {
      autoResizeColumn(grid, colIndex);
      return true;
    }

    grid.selection.selectColumn(colIndex);
    hideFormulaMenu();
    grid.render();
    return true;
  }
}

export class RowSelectionState extends BaseMouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (contentX > CELL_WIDTH || contentY <= CELL_HEIGHT) {
      return false;
    }

    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
    if (rowIndex < 0) {
      return false;
    }

    const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
    const localY = event.offsetY - rowStartCanvasY;
    const height = grid.rowDefinitions[rowIndex]!.height;
    const nearEdge = Math.abs(localY - height) <= 6;

    if (nearEdge) {
      autoResizeRow(grid, rowIndex);
      return true;
    }

    grid.selection.selectRow(rowIndex);
    hideFormulaMenu();
    grid.render();
    return true;
  }
}

export class CellSelectionState extends BaseMouseInteractionState {
  pointerDownHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (contentY <= CELL_HEIGHT || contentX <= CELL_WIDTH) {
      return false;
    }

    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);

    if (rowIndex < 0 || colIndex < 0) {
      return false;
    }

    grid.isSelectingRange = true;
    grid.selectionStartRow = rowIndex;
    grid.selectionStartCol = colIndex;
    grid.selectionCurrentRow = rowIndex;
    grid.selectionCurrentCol = colIndex;
    grid.selection.selectRange(rowIndex, colIndex, rowIndex, colIndex);
    hideFormulaMenu();
    grid.render();
    return true;
  }

  pointerMoveHandler(grid: Grid, event: PointerEvent, contentX: number, contentY: number): boolean {
    if (!grid.isSelectingRange) {
      return false;
    }

    const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
    const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);

    if (rowIndex < 0 || colIndex < 0) {
      return false;
    }

    grid.selectionCurrentRow = rowIndex;
    grid.selectionCurrentCol = colIndex;
    grid.selection.selectRange(grid.selectionStartRow, grid.selectionStartCol, rowIndex, colIndex);
    grid.render();
    return true;
  }

  pointerUpHandler(grid: Grid): boolean {
    if (!grid.isSelectingRange) {
      return false;
    }

    grid.selection.selectRange(grid.selectionStartRow, grid.selectionStartCol, grid.selectionCurrentRow, grid.selectionCurrentCol);
    grid.render();
    grid.isSelectingRange = false;
    grid.selectionStartRow = -1;
    grid.selectionStartCol = -1;
    grid.selectionCurrentRow = -1;
    grid.selectionCurrentCol = -1;
    return true;
  }
}
