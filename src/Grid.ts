import { ColumnDefinition, RowDefinition } from "./models/Dimension.js";
import { DataStore } from "./models/DataStore.js";
import { Selection } from "./models/Selection.js";
import { CommandManager } from "./commands/CommandManager.js";
import { EditCellCommand } from "./commands/EditCellCommand.js";
import { ResizeColumnCommand } from "./commands/ResizeColumnCommand.js";
import { ResizeRowCommand } from "./commands/ResizeRowCommand.js";
import { generateSampleRecords } from "./data/sampleData.js";
import type { RecordRow } from "./data/sampleData.js";

interface GridOptions {
  rowCount: number;
  columnCount: number;
}

export class Grid {
  public static readonly HEADER_HEIGHT = 32;
  public static readonly HEADER_WIDTH = 60;
  public static readonly MIN_COLUMN_WIDTH = 40;
  public static readonly MIN_ROW_HEIGHT = 24;

  public columnDefinitions: ColumnDefinition[] = [];
  public rowDefinitions: RowDefinition[] = [];
  public data = new DataStore();
  public selection = new Selection();
  public commandManager = new CommandManager();

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private wrapper: HTMLDivElement;
  private spacer: HTMLDivElement;
  private editInput: HTMLInputElement;
  private options: GridOptions;
  private scrollLeft = 0;
  private scrollTop = 0;
  private isDraggingColumn = false;
  private isDraggingRow = false;
  private activeResizeIndex = -1;
  private startDragPosition = 0;
  private startSize = 0;

  constructor(
    canvas: HTMLCanvasElement,
    wrapper: HTMLDivElement,
    spacer: HTMLDivElement,
    editInput: HTMLInputElement,
    options: GridOptions
  ) {
    this.canvas = canvas;
    this.wrapper = wrapper;
    this.spacer = spacer;
    this.editInput = editInput;
    this.options = options;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to get canvas rendering context.");
    }
    this.context = context;

    this.createDimensions();
    this.selection.selectCell(0, 0);
    this.configureEventListeners();
  }

  public async initialize(): Promise<void> {
    this.resizeCanvas();
    await this.loadData();
    this.render();
  }

  public resizeCanvas(): void {
    const width = Math.floor(this.wrapper.clientWidth);
    const height = Math.floor(this.wrapper.clientHeight);
    this.canvas.width = width;
    this.canvas.height = height;
    this.updateSpacerSize();
    this.render();
  }

  private updateSpacerSize(): void {
    this.spacer.style.width = `${this.getFullGridWidth()}px`;
    this.spacer.style.height = `${this.getFullGridHeight()}px`;
  }

  private getFullGridWidth(): number {
    return Grid.HEADER_WIDTH + this.columnDefinitions.reduce((sum, column) => sum + column.width, 0);
  }

  private getFullGridHeight(): number {
    return Grid.HEADER_HEIGHT + this.rowDefinitions.reduce((sum, row) => sum + row.height, 0);
  }

  private createDimensions(): void {
    this.columnDefinitions = Array.from({ length: this.options.columnCount }, (_, index) => new ColumnDefinition(index, 100));
    this.rowDefinitions = Array.from({ length: this.options.rowCount }, (_, index) => new RowDefinition(index, 28));
  }

  private async loadData(): Promise<void> {
    const rawRecords = generateSampleRecords(50000);
    const headers = ["id", "firstName", "lastName", "age", "salary"];
    const formattedRecords = rawRecords.map((record) => ({
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      age: record.age,
      salary: record.salary,
    }));
    this.data.loadRecords(formattedRecords, headers);
  }

  public render(): void {
    this.scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;
    this.scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    this.clearCanvas();
    this.renderGridLines();
    this.renderCells();
    this.renderSelection();
    this.renderHeaders();
    this.updateEditInputPosition();
  }

  private clearCanvas(): void {
    this.context.fillStyle = "#ffffff";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private renderHeaders(): void {
    this.context.fillStyle = "#9ca3af";
    this.context.fillRect(0, 0, this.canvas.width, Grid.HEADER_HEIGHT);
    this.context.fillRect(0, 0, Grid.HEADER_WIDTH, this.canvas.height);

    this.context.strokeStyle = "rgba(0,0,0,0.15)";
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(Grid.HEADER_WIDTH, 0);
    this.context.lineTo(Grid.HEADER_WIDTH, this.canvas.height);
    this.context.moveTo(0, Grid.HEADER_HEIGHT);
    this.context.lineTo(this.canvas.width, Grid.HEADER_HEIGHT);

    const visibleColumnsForLines = this.getVisibleColumnRange();
    let headerX = Grid.HEADER_WIDTH + this.getColumnOffset(visibleColumnsForLines.start) - this.scrollLeft;
    for (let colIndex = visibleColumnsForLines.start; colIndex <= visibleColumnsForLines.end; colIndex += 1) {
      headerX += this.columnDefinitions[colIndex].width;
      this.context.moveTo(headerX, 0);
      this.context.lineTo(headerX, Grid.HEADER_HEIGHT);
    }

    const visibleRowsForLines = this.getVisibleRowRange();
    let headerY = Grid.HEADER_HEIGHT + this.getRowOffset(visibleRowsForLines.start) - this.scrollTop;
    for (let rowIndex = visibleRowsForLines.start; rowIndex <= visibleRowsForLines.end; rowIndex += 1) {
      headerY += this.rowDefinitions[rowIndex].height;
      this.context.moveTo(0, headerY);
      this.context.lineTo(Grid.HEADER_WIDTH, headerY);
    }

    this.context.stroke();

    this.context.fillStyle = "#000000";
    this.context.font = "600 12px ui-sans-serif, system-ui";
    this.context.textBaseline = "middle";
    this.context.textAlign = "center";

    const visibleColumns = this.getVisibleColumnRange();
    for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
      const x = Grid.HEADER_WIDTH + this.getColumnOffset(colIndex) - this.scrollLeft;
      const width = this.columnDefinitions[colIndex].width;
      const center = x + width / 2;
      this.context.fillText(this.columnDefinitions[colIndex].label, center, Grid.HEADER_HEIGHT / 2);
    }

    const visibleRows = this.getVisibleRowRange();
    for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
      const y = Grid.HEADER_HEIGHT + this.getRowOffset(rowIndex) - this.scrollTop;
      const height = this.rowDefinitions[rowIndex].height;
      const center = y + height / 2;
      this.context.fillText(this.rowDefinitions[rowIndex].label, Grid.HEADER_WIDTH / 2, center);
    }
  }

  private renderGridLines(): void {
    this.context.strokeStyle = "rgba(148,163,184,0.16)";
    this.context.lineWidth = 1;

    const visibleColumns = this.getVisibleColumnRange();
    let x = Grid.HEADER_WIDTH + this.getColumnOffset(visibleColumns.start) - this.scrollLeft;
    for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
      x += this.columnDefinitions[colIndex].width;
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, this.canvas.height);
      this.context.stroke();
    }

    const visibleRows = this.getVisibleRowRange();
    let y = Grid.HEADER_HEIGHT + this.getRowOffset(visibleRows.start) - this.scrollTop;
    for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
      y += this.rowDefinitions[rowIndex].height;
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.canvas.width, y);
      this.context.stroke();
    }
  }

  private renderCells(): void {
    const visibleColumns = this.getVisibleColumnRange();
    const visibleRows = this.getVisibleRowRange();

    this.context.fillStyle = "#000000";
    this.context.font = "13px ui-sans-serif, system-ui";
    this.context.textBaseline = "middle";
    this.context.textAlign = "left";

    for (let rowIndex = visibleRows.start; rowIndex <= visibleRows.end; rowIndex += 1) {
      const row = this.rowDefinitions[rowIndex];
      const y = Grid.HEADER_HEIGHT + this.getRowOffset(rowIndex) - this.scrollTop;
      for (let colIndex = visibleColumns.start; colIndex <= visibleColumns.end; colIndex += 1) {
        const column = this.columnDefinitions[colIndex];
        const x = Grid.HEADER_WIDTH + this.getColumnOffset(colIndex) - this.scrollLeft;
        const value = this.data.getCellValue(row.index, column.index);
        const displayValue = value === "" ? "" : String(value);
        this.context.fillText(displayValue, x + 8, y + row.height / 2);
      }
    }
  }

  private renderSelection(): void {
    const range = this.selection.range;
    const startX = Grid.HEADER_WIDTH + this.getColumnOffset(range.minCol) - this.scrollLeft;
    const startY = Grid.HEADER_HEIGHT + this.getRowOffset(range.minRow) - this.scrollTop;
    const width = this.columnDefinitions.slice(range.minCol, range.maxCol + 1).reduce((sum, column) => sum + column.width, 0);
    const height = this.rowDefinitions.slice(range.minRow, range.maxRow + 1).reduce((sum, row) => sum + row.height, 0);

    this.context.fillStyle = "rgba(59,130,246,0.2)";
    this.context.fillRect(startX, startY, width, height);

    this.context.strokeStyle = "rgba(59,130,246,0.85)";
    this.context.lineWidth = 2;
    this.context.strokeRect(startX + 0.5, startY + 0.5, width - 1, height - 1);
  }

  private configureEventListeners(): void {
    window.addEventListener("scroll", () => this.render());
    this.canvas.addEventListener("mousedown", (event) => this.handleMouseDown(event));
    this.canvas.addEventListener("mousemove", (event) => this.handleMouseMove(event));
    this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("dblclick", (event) => this.handleDoubleClick(event));
    window.addEventListener("keydown", (event) => this.handleKeyDown(event));
    this.editInput.addEventListener("keydown", (event) => this.handleInputKeyDown(event));
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.editInput.style.display === "block") {
      this.applyEdit(this.editInput.value);
      this.hideEditInput();
    }

    const contentX = event.offsetX + window.pageXOffset;
    const contentY = event.offsetY + window.pageYOffset;

    if (contentX <= Grid.HEADER_WIDTH && contentY <= Grid.HEADER_HEIGHT) {
      return;
    }

    if (contentY <= Grid.HEADER_HEIGHT) {
      const colIndex = this.getColumnIndexAtPosition(contentX - Grid.HEADER_WIDTH);
      if (colIndex >= 0) {
        this.isDraggingColumn = true;
        this.activeResizeIndex = colIndex;
        this.startDragPosition = event.offsetX;
        this.startSize = this.columnDefinitions[colIndex].width;
      }
      return;
    }

    if (contentX <= Grid.HEADER_WIDTH) {
      const rowIndex = this.getRowIndexAtPosition(contentY - Grid.HEADER_HEIGHT);
      if (rowIndex >= 0) {
        this.isDraggingRow = true;
        this.activeResizeIndex = rowIndex;
        this.startDragPosition = event.offsetY;
        this.startSize = this.rowDefinitions[rowIndex].height;
      }
      return;
    }

    const rowIndex = this.getRowIndexAtPosition(contentY - Grid.HEADER_HEIGHT);
    const colIndex = this.getColumnIndexAtPosition(contentX - Grid.HEADER_WIDTH);
    if (rowIndex >= 0 && colIndex >= 0) {
      this.selection.selectCell(rowIndex, colIndex);
      this.render();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const contentX = event.offsetX + window.pageXOffset;
    const contentY = event.offsetY + window.pageYOffset;

    if (this.isDraggingColumn && this.activeResizeIndex >= 0) {
      const delta = event.offsetX - this.startDragPosition;
      const newWidth = Math.max(Grid.MIN_COLUMN_WIDTH, this.startSize + delta);
      this.columnDefinitions[this.activeResizeIndex].width = newWidth;
      this.updateSpacerSize();
      this.render();
      return;
    }

    if (this.isDraggingRow && this.activeResizeIndex >= 0) {
      const delta = event.offsetY - this.startDragPosition;
      const newHeight = Math.max(Grid.MIN_ROW_HEIGHT, this.startSize + delta);
      this.rowDefinitions[this.activeResizeIndex].height = newHeight;
      this.updateSpacerSize();
      this.render();
      return;
    }

    if (contentY <= Grid.HEADER_HEIGHT) {
      const colIndex = this.getColumnIndexAtPosition(contentX - Grid.HEADER_WIDTH);
      this.canvas.style.cursor = colIndex >= 0 ? "col-resize" : "default";
      return;
    }

    if (contentX <= Grid.HEADER_WIDTH) {
      const rowIndex = this.getRowIndexAtPosition(contentY - Grid.HEADER_HEIGHT);
      this.canvas.style.cursor = rowIndex >= 0 ? "row-resize" : "default";
      return;
    }

    this.canvas.style.cursor = "default";
  }

  private handleMouseUp(): void {
    if (this.isDraggingColumn && this.activeResizeIndex >= 0) {
      const finalWidth = this.columnDefinitions[this.activeResizeIndex].width;
      this.commandManager.execute(new ResizeColumnCommand(this.columnDefinitions[this.activeResizeIndex], finalWidth));
    }

    if (this.isDraggingRow && this.activeResizeIndex >= 0) {
      const finalHeight = this.rowDefinitions[this.activeResizeIndex].height;
      this.commandManager.execute(new ResizeRowCommand(this.rowDefinitions[this.activeResizeIndex], finalHeight));
    }

    this.isDraggingColumn = false;
    this.isDraggingRow = false;
    this.activeResizeIndex = -1;
    this.startDragPosition = 0;
    this.startSize = 0;
  }

  private handleDoubleClick(event: MouseEvent): void {
    const contentX = event.offsetX + window.pageXOffset;
    const contentY = event.offsetY + window.pageYOffset;

    if (contentY <= Grid.HEADER_HEIGHT && contentX > Grid.HEADER_WIDTH) {
      const colIndex = this.getColumnIndexAtPosition(contentX - Grid.HEADER_WIDTH);
      if (colIndex >= 0) {
        this.autoResizeColumn(colIndex);
      }
      return;
    }

    if (contentX <= Grid.HEADER_WIDTH && contentY > Grid.HEADER_HEIGHT) {
      const rowIndex = this.getRowIndexAtPosition(contentY - Grid.HEADER_HEIGHT);
      if (rowIndex >= 0) {
        this.autoResizeRow(rowIndex);
      }
      return;
    }

    const row = this.getRowIndexAtPosition(contentY - Grid.HEADER_HEIGHT);
    const col = this.getColumnIndexAtPosition(contentX - Grid.HEADER_WIDTH);
    if (row >= 0 && col >= 0) {
      this.showEditInput(row, col);
    }
  }

  private handleInputKeyDown(event: KeyboardEvent): void {
    if (["Enter", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.key === "Enter") {
      const value = this.editInput.value;
      this.applyEdit(value);
      this.hideEditInput();
      return;
    }

    if (event.key === "Escape") {
      this.hideEditInput();
      return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      const value = this.editInput.value;
      this.applyEdit(value);
      this.hideEditInput();
      this.navigateByKey(event.key);
      return;
    }
  }

  private showEditInput(row: number, col: number): void {
    const x = Grid.HEADER_WIDTH + this.getColumnOffset(col) - this.scrollLeft;
    const y = Grid.HEADER_HEIGHT + this.getRowOffset(row) - this.scrollTop;
    const width = this.columnDefinitions[col].width;
    const height = this.rowDefinitions[row].height;

    this.editInput.style.left = `${x}px`;
    this.editInput.style.top = `${y}px`;
    this.editInput.style.width = `${Math.max(0, width)}px`;
    this.editInput.style.height = `${Math.max(0, height)}px`;
    this.editInput.value = String(this.data.getCellValue(row, col));
    this.editInput.style.display = "block";
    this.editInput.focus();
    this.selection.selectCell(row, col);
    this.render();
  }

  private hideEditInput(): void {
    this.editInput.style.display = "none";
    this.canvas.focus();
  }

  private applyEdit(value: string): void {
    const row = this.selection.anchorRow;
    const col = this.selection.anchorCol;
    const numericValue = value.trim() === "" ? "" : Number(value);
    const finalValue = Number.isNaN(numericValue) ? value : numericValue;
    this.commandManager.execute(new EditCellCommand(this.data, row, col, finalValue));
    this.autoResizeColumnIfNeeded(col, String(finalValue));
    this.render();
  }

  private autoResizeColumnIfNeeded(colIndex: number, value: string): void {
    const textWidth = this.context.measureText(value).width;
    const requiredWidth = Math.ceil(textWidth + 16);
    this.columnDefinitions[colIndex].width = Math.max(this.columnDefinitions[colIndex].width, requiredWidth, Grid.MIN_COLUMN_WIDTH);
    this.updateSpacerSize();
  }

  private navigateByKey(key: string): void {
    let row = this.selection.anchorRow;
    let col = this.selection.anchorCol;

    switch (key) {
      case "ArrowUp":
        row = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        row = Math.min(this.rowDefinitions.length - 1, row + 1);
        break;
      case "ArrowLeft":
        col = Math.max(0, col - 1);
        break;
      case "ArrowRight":
        col = Math.min(this.columnDefinitions.length - 1, col + 1);
        break;
      default:
        return;
    }

    this.selection.selectCell(row, col);
    this.ensureCellVisible(row, col);
    this.render();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)) {
      return;
    }

    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      if (this.editInput.style.display === "block") {
        const value = this.editInput.value;
        this.applyEdit(value);
        this.hideEditInput();
      }
      this.navigateByKey(event.key);
      return;
    }

    if (event.key === "Enter" && this.editInput.style.display === "none") {
      event.preventDefault();
      this.showEditInput(this.selection.anchorRow, this.selection.anchorCol);
    }
  }

  private ensureCellVisible(row: number, col: number): void {
    const x = this.getColumnOffset(col);
    const y = this.getRowOffset(row);
    const left = Math.max(0, x - 20);
    const top = Math.max(0, y - 20);
    window.scrollTo({ left, top, behavior: "smooth" });
  }

  private updateEditInputPosition(): void {
    if (this.editInput.style.display !== "block") {
      return;
    }

    const row = this.selection.anchorRow;
    const col = this.selection.anchorCol;
    const x = Grid.HEADER_WIDTH + this.getColumnOffset(col) - this.scrollLeft;
    const y = Grid.HEADER_HEIGHT + this.getRowOffset(row) - this.scrollTop;
    const width = this.columnDefinitions[col].width;
    const height = this.rowDefinitions[row].height;

    const isVisible = x + width > 0 && x < this.canvas.width && y + height > 0 && y < this.canvas.height;
    if (!isVisible) {
      this.hideEditInput();
      return;
    }

    this.editInput.style.left = `${x}px`;
    this.editInput.style.top = `${y}px`;
    this.editInput.style.width = `${Math.max(0, width)}px`;
    this.editInput.style.height = `${Math.max(0, height)}px`;
  }

  private autoResizeColumn(colIndex: number): void {
    const headerWidth = this.context.measureText(this.columnDefinitions[colIndex].label).width;
    let maxWidth = headerWidth;
    this.data.getEntries().forEach((entry) => {
      if (entry.col !== colIndex) {
        return;
      }
      const value = String(entry.value);
      const width = this.context.measureText(value).width;
      if (width > maxWidth) {
        maxWidth = width;
      }
    });

    this.columnDefinitions[colIndex].width = Math.max(Grid.MIN_COLUMN_WIDTH, Math.ceil(maxWidth + 16));
    this.updateSpacerSize();
    this.render();
  }

  private autoResizeRow(rowIndex: number): void {
    const baseHeight = Grid.MIN_ROW_HEIGHT;
    let maxHeight = baseHeight;
    this.data.getEntries().forEach((entry) => {
      if (entry.row !== rowIndex) {
        return;
      }
      const value = String(entry.value);
      const metrics = this.context.measureText(value);
      const contentHeight = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 12);
      if (contentHeight > maxHeight) {
        maxHeight = contentHeight;
      }
    });

    this.rowDefinitions[rowIndex].height = Math.max(Grid.MIN_ROW_HEIGHT, maxHeight);
    this.updateSpacerSize();
    this.render();
  }

  private getColumnOffset(index: number): number {
    return this.columnDefinitions.slice(0, index).reduce((sum, column) => sum + column.width, 0);
  }

  private getRowOffset(index: number): number {
    return this.rowDefinitions.slice(0, index).reduce((sum, row) => sum + row.height, 0);
  }

  private getColumnIndexAtPosition(positionX: number): number {
    if (positionX < 0) {
      return 0;
    }
    let currentX = 0;
    for (let index = 0; index < this.columnDefinitions.length; index += 1) {
      const width = this.columnDefinitions[index].width;
      if (positionX < currentX + width) {
        return index;
      }
      currentX += width;
    }
    return -1;
  }

  private getRowIndexAtPosition(positionY: number): number {
    if (positionY < 0) {
      return 0;
    }
    let currentY = 0;
    for (let index = 0; index < this.rowDefinitions.length; index += 1) {
      const height = this.rowDefinitions[index].height;
      if (positionY < currentY + height) {
        return index;
      }
      currentY += height;
    }
    return -1;
  }

  private getVisibleColumnRange(): { start: number; end: number } {
    const offsetX = Math.max(0, this.scrollLeft - Grid.HEADER_WIDTH);
    let start = this.getColumnIndexAtPosition(offsetX);
    if (start < 0) {
      start = 0;
    }
    const viewWidth = this.canvas.width - Grid.HEADER_WIDTH;
    let visibleWidth = this.getColumnOffset(start) + this.columnDefinitions[start].width - offsetX;
    let end = start;
    while (end + 1 < this.columnDefinitions.length && visibleWidth < viewWidth) {
      end += 1;
      visibleWidth += this.columnDefinitions[end].width;
    }
    return { start, end };
  }

  private getVisibleRowRange(): { start: number; end: number } {
    const offsetY = Math.max(0, this.scrollTop - Grid.HEADER_HEIGHT);
    let start = this.getRowIndexAtPosition(offsetY);
    if (start < 0) {
      start = 0;
    }
    const viewHeight = this.canvas.height - Grid.HEADER_HEIGHT;
    let visibleHeight = this.getRowOffset(start) + this.rowDefinitions[start].height - offsetY;
    let end = start;
    while (end + 1 < this.rowDefinitions.length && visibleHeight < viewHeight) {
      end += 1;
      visibleHeight += this.rowDefinitions[end].height;
    }
    return { start, end };
  }
}
