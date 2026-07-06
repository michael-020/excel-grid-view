import type { Command } from "./Command.js";
import { ColumnDefinition } from "../models/Dimension.js";

export class ResizeColumnCommand implements Command {
  constructor(
    private readonly column: ColumnDefinition,
    private readonly previousWidth: number,
    private readonly newWidth: number
  ) {}

  execute(): void {
    this.column.width = this.newWidth;
  }

  undo(): void {
    this.column.width = this.previousWidth;
  }
}
