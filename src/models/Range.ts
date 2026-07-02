export class Range {
  constructor(
    public startRow: number,
    public startCol: number,
    public endRow: number,
    public endCol: number
  ) {}

  get minRow(): number {
    return Math.min(this.startRow, this.endRow);
  }

  get maxRow(): number {
    return Math.max(this.startRow, this.endRow);
  }

  get minCol(): number {
    return Math.min(this.startCol, this.endCol);
  }

  get maxCol(): number {
    return Math.max(this.startCol, this.endCol);
  }

  contains(row: number, col: number): boolean {
    return row >= this.minRow && row <= this.maxRow && col >= this.minCol && col <= this.maxCol;
  }

  equals(other: Range): boolean {
    return (
      this.startRow === other.startRow &&
      this.startCol === other.startCol &&
      this.endRow === other.endRow &&
      this.endCol === other.endCol
    );
  }
}
