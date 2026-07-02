export class Cell {
  constructor(
    public row: number,
    public col: number,
    public value: string | number
  ) {}

  get id(): string {
    return `${this.row}:${this.col}`;
  }
}
