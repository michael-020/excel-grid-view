import { ColumnDefinition, RowDefinition } from "./models/Dimension.js";
import { DataStore } from "./models/DataStore.js";
import { Selection } from "./models/Selection.js";
import { CommandManager } from "./commands/CommandManager.js";
import { generateSampleRecords } from "./data/sampleData.js";
import { renderGrid } from "./helpers/GridRenderer.js";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleDoubleClick,
} from "./helpers/GridEvents.js";
import { handleKeyDown } from "./helpers/GridKeyboard.js";
import { copySelection, pasteClipboardAt } from "./helpers/GridClipboard.js";
import { insertFormula, hideFormulaMenu, showEditInput, handleEditInputChange, handleInputKeyDown } from "./helpers/GridEditor.js";
import { updateSpacerSize } from "./helpers/GridLayout.js";

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
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public wrapper: HTMLDivElement;
  public spacer: HTMLDivElement;
  public editInput: HTMLInputElement;
  public summaryBar?: HTMLDivElement;
  public scrollLeft = 0;
  public scrollTop = 0;
  public isDraggingColumn = false;
  public isDraggingRow = false;
  public isSelectingRange = false;
  public activeResizeIndex = -1;
  public startDragPosition = 0;
  public startSize = 0;
  public selectionStartRow = -1;
  public selectionStartCol = -1;
  public selectionCurrentRow = -1;
  public selectionCurrentCol = -1;
  public clipboard: { rows: number; cols: number; values: Array<Array<string | number>> } | null = null;
  public lastFormulaError: string | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    wrapper: HTMLDivElement,
    spacer: HTMLDivElement,
    editInput: HTMLInputElement,
    options: GridOptions,
    summaryBar?: HTMLDivElement
  ) {
    this.canvas = canvas;
    this.wrapper = wrapper;
    this.spacer = spacer;
    this.editInput = editInput;
    this.summaryBar = summaryBar;
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

  private options: GridOptions;

  public async initialize(): Promise<void> {
    this.resizeCanvas();
    await this.loadData();
    this.render();
  }

  public undo(): void {
    this.commandManager.undo();
    this.render();
  }

  public redo(): void {
    this.commandManager.redo();
    this.render();
  }

  public canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  public canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  public resizeCanvas(): void {
    const width = Math.floor(this.wrapper.clientWidth);
    const height = Math.floor(this.wrapper.clientHeight);
    const ratio = window.devicePixelRatio || 1;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = Math.max(1, Math.floor(width * ratio));
    this.canvas.height = Math.max(1, Math.floor(height * ratio));
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);

    updateSpacerSize(this);
    this.render();
  }

  public render(): void {
    renderGrid(this);
  }

  private configureEventListeners(): void {
    window.addEventListener("scroll", () => this.render());
    this.canvas.addEventListener("mousedown", (event) => handleMouseDown(this, event));
    this.canvas.addEventListener("mousemove", (event) => handleMouseMove(this, event));
    this.canvas.addEventListener("mouseup", () => handleMouseUp(this));
    this.canvas.addEventListener("dblclick", (event) => handleDoubleClick(this, event));
    window.addEventListener("keydown", (event) => handleKeyDown(this, event));
    this.editInput.addEventListener("keydown", (event) => handleInputKeyDown(this, event));
    this.editInput.addEventListener("input", () => handleEditInputChange(this));

    const formulaMenu = document.getElementById("formula-menu") as HTMLDivElement | null;
    if (formulaMenu) {
      const funcs = ["SUM", "AVG", "COUNT", "MIN", "MAX"];
      formulaMenu.innerHTML = funcs.map((f) => `<div class="item" data-func="${f}">=${f}()</div>`).join("");
      formulaMenu.addEventListener("click", (ev) => {
        const target = ev.target as HTMLElement;
        const func = target?.dataset?.func;
        if (func) {
          insertFormula(this, func);
        }
      });
    }
  }

  public copySelection(): void {
    copySelection(this);
  }

  public pasteClipboardAt(targetRow: number, targetCol: number): void {
    pasteClipboardAt(this, targetRow, targetCol);
  }

  public ensureCellVisible(row: number, col: number): void {
    const x = this.columnDefinitions.slice(0, col).reduce((sum, column) => sum + column.width, 0);
    const y = this.rowDefinitions.slice(0, row).reduce((sum, rowDef) => sum + rowDef.height, 0);
    const left = Math.max(0, x - 20);
    const top = Math.max(0, y - 20);
    window.scrollTo({ left, top, behavior: "smooth" });
  }

  public showEditInput(row: number, col: number): void {
    showEditInput(this, row, col);
  }

  public hideFormulaMenu(): void {
    hideFormulaMenu(this);
  }

  private createDimensions(): void {
    this.columnDefinitions = Array.from({ length: this.options.columnCount }, (_, index) => new ColumnDefinition(index, 100));
    this.rowDefinitions = Array.from({ length: this.options.rowCount }, (_, index) => new RowDefinition(index, 28));
  }

  private async loadData(): Promise<void> {
    const rawRecords = generateSampleRecords(50000);
    const formattedRecords = rawRecords.map((record) => ({
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      age: record.age,
      salary: record.salary,
    }));
    this.data.loadRecords(formattedRecords, ["id", "firstName", "lastName", "age", "salary"]);
  }
}
