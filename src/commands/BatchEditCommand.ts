import type { Command } from "./Command.js";
import { DataStore } from "../models/DataStore.js";
import { Cell } from "../models/Cell.js";

type Edit = { row: number; col: number; oldValue: string | number; newValue: string | number };

export class BatchEditCommand implements Command {
  constructor(private readonly dataStore: DataStore, private readonly edits: Edit[]) {}

  execute(): void {
    this.edits.forEach((e) => {
      this.dataStore.setCell(new Cell(e.row, e.col, e.newValue));
    });
  }

  undo(): void {
    for (let i = this.edits.length - 1; i >= 0; i -= 1) {
      const e = this.edits[i]!;
      if (e.oldValue === "" || e.oldValue === undefined) {
        this.dataStore.deleteCell(e.row, e.col);
      } else {
        this.dataStore.setCell(new Cell(e.row, e.col, e.oldValue));
      }
    }
  }
}
