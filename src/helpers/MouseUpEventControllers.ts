import { ResizeColumnCommand } from "../commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "../commands/ResizeRowCommand.js";
import type { Grid } from "../Grid.js";

export class MouseUpEventControllers{

    // handles the final size of column after resizing 
    handleFinalColSize(grid: Grid){
        if (grid.isDraggingColumn && grid.activeResizeIndex >= 0) {
            const finalWidth = grid.columnDefinitions[grid.activeResizeIndex]!.width;
            if (finalWidth !== grid.startSize) {
              grid.commandManager.execute(new ResizeColumnCommand(grid.columnDefinitions[grid.activeResizeIndex]!, grid.startSize, finalWidth));
            }
        }
    }

    // handles the final size of row after resizing
    handleFinalRowSize(grid: Grid){
        if (grid.isDraggingRow && grid.activeResizeIndex >= 0) {
            const finalHeight = grid.rowDefinitions[grid.activeResizeIndex]!.height;
            if (finalHeight !== grid.startSize) {
              grid.commandManager.execute(new ResizeRowCommand(grid.rowDefinitions[grid.activeResizeIndex]!, grid.startSize, finalHeight));
            }
        }
    }

    // used to highlight the selected range in a grid
    highlightSelectedCellRange(grid: Grid){
        if (grid.isSelectingRange) {
            console.log("range selected")
            grid.selection.selectRange(grid.selectionStartRow, grid.selectionStartCol, grid.selectionCurrentRow, grid.selectionCurrentCol);
            grid.render();
        }
    }

    // reset state
    resetState(grid: Grid){
        grid.isDraggingColumn = false;
        grid.isDraggingRow = false;
        grid.isSelectingRange = false;
        grid.activeResizeIndex = -1;
        grid.startDragPosition = 0;
        grid.startSize = 0;
        grid.selectionStartRow = -1;
        grid.selectionStartCol = -1;
        grid.selectionCurrentRow = -1;
        grid.selectionCurrentCol = -1;
    }
}