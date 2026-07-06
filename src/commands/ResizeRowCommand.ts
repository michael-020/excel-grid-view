import type { Command } from "./Command.js";
import { RowDefinition } from "../models/Dimension.js";

export class ResizeRowCommand implements Command {
  constructor(
    private readonly row: RowDefinition,
    private readonly previousHeight: number,
    private readonly newHeight: number
  ) {}

  execute(): void {
    this.row.height = this.newHeight;
  }

  undo(): void {
    this.row.height = this.previousHeight;
  }
}
