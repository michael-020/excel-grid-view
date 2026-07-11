import { Grid } from "./Grid.js";

const wrapper = document.getElementById("grid-wrapper") as HTMLDivElement;
const canvas = document.getElementById("grid-canvas") as HTMLCanvasElement;
const spacer = document.getElementById("grid-spacer") as HTMLDivElement;
const editInput = document.getElementById("edit-input") as HTMLInputElement;
const summaryBar = document.getElementById("summary-bar") as HTMLDivElement;

const grid = new Grid(canvas, wrapper, spacer, editInput, {
  rowCount: 100000,
  columnCount: 500,
}, summaryBar);

window.addEventListener("load", async () => {
  await grid.initialize();
});

window.addEventListener("resize", () => {
  grid.resizeCanvas();
  grid.render();
});
