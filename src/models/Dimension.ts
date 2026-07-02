export class ColumnDefinition {
  constructor(public index: number, public width: number = 100) {}

  get label(): string {
    let col = this.index;
    let name = "";
    while (col >= 0) {
      name = String.fromCharCode(65 + (col % 26)) + name;
      col = Math.floor(col / 26) - 1;
    }
    return name;
  }
}

export class RowDefinition {
  constructor(public index: number, public height: number = 28) {}

  get label(): string {
    return (this.index + 1).toString();
  }
}
