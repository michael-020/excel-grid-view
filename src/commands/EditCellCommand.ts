import type { Command } from "./Command.js";
import { Cell } from "../models/Cell.js";
import { DataStore } from "../models/DataStore.js";

export class EditCellCommand implements Command {
  private oldValue: string | number;

  constructor(
    private readonly dataStore: DataStore,
    private readonly row: number,
    private readonly col: number,
    private readonly newValue: string | number
  ) {
    this.oldValue = dataStore.getCellValue(row, col);
  }

  execute(): void {
    this.dataStore.setCell(new Cell(this.row, this.col, this.newValue));
  }

  undo(): void {
    if (this.oldValue === "" || this.oldValue === undefined) {
      this.dataStore.deleteCell(this.row, this.col);
      return;
    }
    this.dataStore.setCell(new Cell(this.row, this.col, this.oldValue));
  }
}
