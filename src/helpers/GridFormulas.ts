// this function is used to evaluate an expression based on a certain mathematical formula
export function evaluateFormula(formula: string, data: any): { error?: string; value?: number | string } {
  const expression = formula.trim().slice(1).trim();
  const m = expression.match(/^([A-Za-z]+)\s*\((.*)\)$/);
  if (!m) return { error: "Invalid formula format" };
  const func = m[1]!.toLowerCase();
  const args = m[2]!.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  const values: number[] = [];
  let count = 0;

  if (args.length === 2 && isSingleCellRef(args[0]!) && isSingleCellRef(args[1]!) && ["sum", "avg", "average", "count", "min", "max"].includes(func)) {
    const rangeRef = rangeRefFromCellRefs(args[0]!, args[1]!);
    if (!rangeRef) return { error: "Invalid reference" };
    if (func === "count") {
      const countResult = countValuesFromRef(rangeRef, data);
      if (countResult.error) return { error: countResult.error };
      return { value: countResult.count ?? 0 };
    }
    const vals = valuesFromRef(rangeRef, data);
    if (vals.error) return { error: vals.error };
    values.push(...(vals.values || []));
  } else {
    for (const arg of args) {
      if (func === "count") {
        const countResult = countValuesFromRef(arg, data);
        if (countResult.error) return { error: countResult.error };
        count += countResult.count!;
      } else {
        const vals = valuesFromRef(arg, data);
        if (vals.error) return { error: vals.error };
        values.push(...(vals.values || []));
      }
    }
  }

  switch (func) {
    case "sum":
      return { value: values.reduce((a, b) => a + b, 0) };
    case "avg":
    case "average":
      return { value: values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length };
    case "count":
      return { value: count };
    case "min":
      return { value: values.length === 0 ? 0 : Math.min(...values) };
    case "max":
      return { value: values.length === 0 ? 0 : Math.max(...values) };
    default:
      return { error: `Unknown function ${func}` };
  }
}

// this function is used to determine if a reference is a single cell
function isSingleCellRef(ref: string): boolean {
  return /^([A-Za-z]+)\s*(\d+)$/.test(ref);
}

// this functions is used to get the range of the cells
function rangeRefFromCellRefs(first: string, second: string): string | null {
  const a = first.match(/^([A-Za-z]+)\s*(\d+)$/);
  const b = second.match(/^([A-Za-z]+)\s*(\d+)$/);
  if (!a || !b) return null;
  return `${a[1]}${a[2]}:${b[1]}${b[2]}`;
}

// this function is used to get values from a certain cell
export function valuesFromRef(ref: string, data: any): { error?: string; values?: number[] } {
  const rangeMatch = ref.match(/^([A-Za-z]+)\s*(\d+)\s*:\s*([A-Za-z]+)\s*(\d+)$/);
  if (rangeMatch) {
    const startCol = colLabelToIndex(rangeMatch[1]!);
    const startRow = Number(rangeMatch[2]) - 1;
    const endCol = colLabelToIndex(rangeMatch[3]!);
    const endRow = Number(rangeMatch[4]) - 1;
    if (startCol < 0 || startRow < 0 || endCol < 0 || endRow < 0) return { error: "Invalid range" };
    const values: number[] = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r += 1) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c += 1) {
        const v = data.getCellValue(r, c);
        if (v === "" || v === undefined) return { error: "Non-numeric or empty cell in range" };
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isNaN(n)) return { error: "Non-numeric cell in range" };
        values.push(n);
      }
    }
    return { values };
  }

  const singleMatch = ref.match(/^([A-Za-z]+)\s*(\d+)$/);
  if (singleMatch) {
    const col = colLabelToIndex(singleMatch[1]!);
    const row = Number(singleMatch[2]) - 1;
    if (col < 0 || row < 0) return { error: "Invalid reference" };
    const v = data.getCellValue(row, col);
    if (v === "" || v === undefined) return { error: "Non-numeric or empty cell in reference" };
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return { error: "Non-numeric cell in reference" };
    return { values: [n] };
  }

  return { error: `Invalid reference ${ref}` };
}

// this function is used to count the number of values in a range
export function countValuesFromRef(ref: string, data: any): { error?: string; count?: number } {
  const rangeMatch = ref.match(/^([A-Za-z]+)\s*(\d+)\s*:\s*([A-Za-z]+)\s*(\d+)$/);
  if (rangeMatch) {
    const startCol = colLabelToIndex(rangeMatch[1]!);
    const startRow = Number(rangeMatch[2]) - 1;
    const endCol = colLabelToIndex(rangeMatch[3]!);
    const endRow = Number(rangeMatch[4]) - 1;
    if (startCol < 0 || startRow < 0 || endCol < 0 || endRow < 0) return { error: "Invalid range" };
    let count = 0;
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r += 1) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c += 1) {
        const v = data.getCellValue(r, c);
        if (v !== "" && v !== undefined) {
          count += 1;
        }
      }
    }
    return { count };
  }

  const singleMatch = ref.match(/^([A-Za-z]+)\s*(\d+)$/);
  if (singleMatch) {
    const col = colLabelToIndex(singleMatch[1]!);
    const row = Number(singleMatch[2]) - 1;
    if (col < 0 || row < 0) return { error: "Invalid reference" };
    const v = data.getCellValue(row, col);
    return { count: v !== "" && v !== undefined ? 1 : 0 };
  }

  return { error: `Invalid reference ${ref}` };
}

// this function is used to get index of a column
function colLabelToIndex(label: string): number {
  let col = 0;
  const s = label.toUpperCase();
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i) - 64;
    if (code < 1 || code > 26) return -1;
    col = col * 26 + code;
  }

  return col - 1;
}
