import type { Grid } from "../Grid.js";
import { CELL_HEIGHT, CELL_WIDTH, MIN_CELL_HEIGHT, MIN_CELL_WIDTH } from "../lib/constants.js";
import { getColumnIndexAtPosition, getColumnOffset, getRowIndexAtPosition, getRowOffset, updateSpacerSize } from "./GridLayout.js";

export class MouseMoveEventControllers{

    // handles column resizing
    handleColResizing(grid: Grid, event: PointerEvent){
        if (grid.isDraggingColumn && grid.activeResizeIndex >= 0) {
            const delta = event.offsetX - grid.startDragPosition;
            const newWidth = Math.max(MIN_CELL_WIDTH, grid.startSize + delta);
            grid.columnDefinitions[grid.activeResizeIndex]!.width = newWidth;
            updateSpacerSize(grid);
            grid.render();
            return;
        }
    }

    // handles row resizing
    handleRowResizing(grid: Grid, event: PointerEvent){
        if (grid.isDraggingRow && grid.activeResizeIndex >= 0) {
            const delta = event.offsetY - grid.startDragPosition;
            const newHeight = Math.max(MIN_CELL_HEIGHT, grid.startSize + delta);
            grid.rowDefinitions[grid.activeResizeIndex]!.height = newHeight;
            updateSpacerSize(grid);
            grid.render();
            return;
        }
    }

      // handles range of cells selection in the grid
    handleRangeSelection(grid: Grid, contentX: number, contentY: number){
        if (grid.isSelectingRange) {
            const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
            const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
            if (rowIndex >= 0 && colIndex >= 0) {
              grid.selectionCurrentRow = rowIndex;
              grid.selectionCurrentCol = colIndex;
              grid.selection.selectRange(grid.selectionStartRow, grid.selectionStartCol, rowIndex, colIndex);
              grid.render();
            }
            return;
        }
    }

    // update cursor style when mouse pointer is over the column headers
    updateCursorOnColHeaders(grid: Grid, contentX: number, contentY: number, event: PointerEvent){
        const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH); 
        const columnStartCanvasX = CELL_WIDTH + getColumnOffset(grid.columnDefinitions, colIndex) - grid.scrollLeft;
        const localX = event.offsetX - columnStartCanvasX;
        const width = grid.columnDefinitions[colIndex]!.width;
        const nearEdge = Math.abs(localX - width) <= 10;
        if (contentY <= CELL_HEIGHT && nearEdge) {
            const colIndex = getColumnIndexAtPosition(grid.columnDefinitions, contentX - CELL_WIDTH);
            grid.canvas.style.cursor = colIndex >= 0 ? "col-resize" : "default";
            return;
        }
        else{
            grid.canvas.style.cursor = "default";
        }
    }

    // update cursor style when mouse pointer is over the row headers
    updateCursorOnRowHeaders(grid: Grid, contentX: number, contentY: number, event: PointerEvent){
        const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
        const rowStartCanvasY = CELL_HEIGHT + getRowOffset(grid.rowDefinitions, rowIndex) - grid.scrollTop;
        const localY = event.offsetY - rowStartCanvasY;
        const height = grid.rowDefinitions[rowIndex]!.height;
        const nearEdge = Math.abs(localY - height) <= 10;
        if (contentX <= CELL_WIDTH && nearEdge) {
            const rowIndex = getRowIndexAtPosition(grid.rowDefinitions, contentY - CELL_HEIGHT);
            grid.canvas.style.cursor = rowIndex >= 0 ? "row-resize" : "default";
            return;
        }
    }
}