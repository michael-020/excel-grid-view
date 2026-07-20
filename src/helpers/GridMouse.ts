import type { Grid } from "../Grid.js";
import { applyEdit, hideEditInput } from "./GridEditor.js";
import { CELL_HEIGHT, CELL_WIDTH } from "../lib/constants.js";
import {
  CellSelectionState,
  ColResizeState,
  ColSelectionState,
  RowResizeState,
  RowSelectionState,
  type MouseInteractionState,
} from "./MouseInteractionStates.js";

const mouseInteractionStates: MouseInteractionState[] = [
  new ColResizeState(),
  new RowResizeState(),
  new ColSelectionState(),
  new RowSelectionState(),
  new CellSelectionState(),
];

// this function handles all the actions to be done when the mouse-down event is triggered
export function handleMouseDown(grid: Grid, event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }

  if (grid.editInput.style.display === "block") {
    applyEdit(grid, grid.editInput.value);
    hideEditInput(grid);
  }

  const contentX = event.offsetX + window.pageXOffset;
  const contentY = event.offsetY + window.pageYOffset;

  if (contentX <= CELL_WIDTH && contentY <= CELL_HEIGHT) {
    return;
  }

  for (const state of mouseInteractionStates) {
    if (state.pointerDownHandler(grid, event, contentX, contentY)) {
      return;
    }
  }
}

// this function handles all the actions to be done when the mouse-move event is triggered
export function handleMouseMove(grid: Grid, event: PointerEvent): void {
  const contentX = event.offsetX + window.pageXOffset;
  const contentY = event.offsetY + window.pageYOffset;

  for (const state of mouseInteractionStates) {
    if (state.pointerMoveHandler(grid, event, contentX, contentY)) {
      return;
    }
  }
}

// this function handles all the actions to be done when the mouse-up event is triggered
export function handleMouseUp(grid: Grid): void {
  for (const state of mouseInteractionStates) {
    if (state.pointerUpHandler(grid)) {
      return;
    }
  }
}
