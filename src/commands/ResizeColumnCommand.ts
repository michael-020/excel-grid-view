import type { Command } from "./Command.js";
import { ColumnDefinition } from "../models/Dimension.js";

export class ResizeColumnCommand implements Command {
  private previousWidth: number;

  constructor(private readonly column: ColumnDefinition, private readonly newWidth: number) {
    this.previousWidth = column.width;
  }

  execute(): void {
    this.column.width = this.newWidth;
  }

  undo(): void {
    this.column.width = this.previousWidth;
  }
}
