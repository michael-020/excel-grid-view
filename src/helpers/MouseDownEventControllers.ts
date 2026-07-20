import type { Grid } from "../Grid.js";
import { CELL_HEIGHT, CELL_WIDTH } from "../lib/constants.js";
import { hideFormulaMenu } from "./GridEditor.js";
import { autoResizeColumn, autoResizeRow, getColumnIndexAtPosition, getColumnOffset, getRowIndexAtPosition, getRowOffset } from "./GridLayout.js";

export class MouseDownEventControllers{

    // this function handles the condition when mouse pointer is on the column headers
    handlePointerOnColHeaders(grid: Grid, contentX: number, contentY: number, event: PointerEvent){
        if (contentY <= CELL_HEIGHT) {
            const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
            if (colIndex >= 0) {
              const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
              const localX = event.offsetX - columnStartCanvasX;
              const width = grid.columnDefinitions[colIndex]!.width;
              const nearEdge = Math.abs(localX - width) <= 6;
              if (nearEdge) {
                grid.isDraggingColumn = true;
                grid.activeResizeIndex = colIndex;
                grid.startDragPosition = event.offsetX;
                grid.startSize = grid.columnDefinitions[colIndex]!.width;
              }
            }
            return;
          }
    }

    // this function handles the condition when the mouse pointer is on the row headers
    handlePointerOnRowHeaders(grid: Grid, contentX: number, contentY: number, event: PointerEvent){
        if (contentX <= CELL_WIDTH) {
            const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
            if (rowIndex >= 0) {
              const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
              const localY = event.offsetY - rowStartCanvasY;
              const height = grid.rowDefinitions[rowIndex]!.height;
              const nearEdge = Math.abs(localY - height) <= 6;
              if (nearEdge) {
                grid.isDraggingRow = true;
                grid.activeResizeIndex = rowIndex;
                grid.startDragPosition = event.offsetY;
                grid.startSize = grid.rowDefinitions[rowIndex]!.height;
              }
            }
            return;
        }
    }

    // this function handles cell selection
    selectItem(grid: Grid, contentX: number, contentY: number, event: PointerEvent){
      if (contentY <= CELL_HEIGHT && contentX > CELL_WIDTH) { // select column - when mouse pointer is over column headers
        const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
        if (colIndex >= 0) {
          const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
          const localX = event.offsetX - columnStartCanvasX;
          const width = grid.columnDefinitions[colIndex]!.width;
          const nearEdge = Math.abs(localX - width) <= 6;
          if (nearEdge) {
            autoResizeColumn(grid, colIndex);
          } else {
            grid.selection.selectColumn(colIndex);
            hideFormulaMenu();
            grid.render();
          }
        }
        return;
      }
      else if (contentX <= CELL_WIDTH && contentY > CELL_HEIGHT) { // select row - when mouse pointer is over row headers
        const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
        if (rowIndex >= 0) {
          const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
          const localY = event.offsetY - rowStartCanvasY;
          const height = grid.rowDefinitions[rowIndex]!.height;
          const nearEdge = Math.abs(localY - height) <= 6;
          if (nearEdge) {
            autoResizeRow(grid, rowIndex);
          } else {
            grid.selection.selectRow(rowIndex);
            hideFormulaMenu();
            grid.render();
          }
        }
        return;
      }
      else{
        const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
        const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
        // mark a cell as selected on mouse down event when rowIndex and colIndex are both >= 0
        if (rowIndex >= 0 && colIndex >= 0) {
          grid.isSelectingRange = true;
          grid.selectionStartRow = rowIndex;
          grid.selectionStartCol = colIndex;
          grid.selectionCurrentRow = rowIndex;
          grid.selectionCurrentCol = colIndex;
          grid.selection.selectRange(rowIndex, colIndex, rowIndex, colIndex);
          hideFormulaMenu();
          grid.render();
        }
      }
    }
}