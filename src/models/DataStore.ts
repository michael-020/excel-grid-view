import { Cell } from "./Cell.js";

export class DataStore {
  private values = new Map<string, string | number>();

  public setCell(cell: Cell): void {
    this.values.set(cell.id, cell.value);
  }

  public getCellValue(row: number, col: number): string | number {
    return this.values.get(`${row}:${col}`) ?? "";
  }

  public loadRecords(records: Array<Record<string, string | number>>, headers: string[]): void {
    records.forEach((record, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const value = record[header];
        if (value !== undefined && value !== null) {
          this.setCell(new Cell(rowIndex, colIndex, value));
        }
      });
    });
  }

  public getEntries(): Array<{ row: number; col: number; value: string | number }> {
    return Array.from(this.values.entries()).map(([key, value]) => {
      const [row, col] = key.split(":").map(Number);
      return { row, col, value };
    });
  }

  public deleteCell(row: number, col: number): void {
    this.values.delete(`${row}:${col}`);
  }
}
