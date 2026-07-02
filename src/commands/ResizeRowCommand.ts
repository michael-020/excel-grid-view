import type { Command } from "./Command.js";
import { RowDefinition } from "../models/Dimension.js";

export class ResizeRowCommand implements Command {
  private previousHeight: number;

  constructor(private readonly row: RowDefinition, private readonly newHeight: number) {
    this.previousHeight = row.height;
  }

  execute(): void {
    this.row.height = this.newHeight;
  }

  undo(): void {
    this.row.height = this.previousHeight;
  }
}
