import { Range } from "./Range.js";
import { DataStore } from "./DataStore.js";

export type SelectionMode = "cell" | "row" | "column" | "range";

export class Selection {
  public anchorRow = 0;
  public anchorCol = 0;
  public range = new Range(0, 0, 0, 0);
  public mode: SelectionMode = "cell";

  public selectCell(row: number, col: number): void {
    this.anchorRow = row;
    this.anchorCol = col;
    this.range = new Range(row, col, row, col);
    this.mode = "cell";
  }

  public selectRow(row: number): void {
    this.anchorRow = row;
    this.anchorCol = 0;
    this.range = new Range(row, 0, row, 499);
    this.mode = "row";
  }

  public selectColumn(col: number): void {
    this.anchorRow = 0;
    this.anchorCol = col;
    this.range = new Range(0, col, 99999, col);
    this.mode = "column";
  }

  public selectRange(startRow: number, startCol: number, endRow: number, endCol: number): void {
    this.anchorRow = startRow;
    this.anchorCol = startCol;
    this.range = new Range(startRow, startCol, endRow, endCol);
    this.mode = "range";
  }

  public getSummary(data: DataStore): {
    mode: string;
    anchor: string;
    range: string;
    count: number;
    sumString: string;
    minString: string;
    maxString: string;
    avgString: string;
  } {
    const values: number[] = [];
    let count = 0;
    for (let row = this.range.minRow; row <= this.range.maxRow; row += 1) {
      for (let col = this.range.minCol; col <= this.range.maxCol; col += 1) {
        const cellValue = data.getCellValue(row, col);
        if (cellValue !== "" && cellValue !== undefined) {
          count += 1;
        }
        const numeric = typeof cellValue === "number" ? cellValue : Number(cellValue);
        if (!Number.isNaN(numeric)) {
          values.push(numeric);
        }
      }
    }

    const sum = values.reduce((acc, value) => acc + value, 0);
    const min = values.length > 0 ? Math.min(...values) : undefined;
    const max = values.length > 0 ? Math.max(...values) : undefined;
    const avg = values.length > 0 ? sum / values.length : undefined;

    return {
      mode: this.mode,
      anchor: `${this.anchorRow + 1}:${this.anchorCol + 1}`,
      range: `${this.range.minRow + 1}:${this.range.minCol + 1} - ${this.range.maxRow + 1}:${this.range.maxCol + 1}`,
      count,
      sumString: values.length > 0 ? sum.toString() : "0",
      minString: min !== undefined ? min.toString() : "-",
      maxString: max !== undefined ? max.toString() : "-",
      avgString: avg !== undefined ? avg.toFixed(2) : "-",
    };
  }
}
