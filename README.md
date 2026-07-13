# Excel Grid View

## Project Name and Objective

**Excel Grid View** is a browser-based spreadsheet-style grid application built with TypeScript and HTML5 Canvas. The objective is to provide a fast, virtualized grid viewer and editor with row/column headers, selection, in-cell editing, formula support, clipboard operations, undo/redo, and efficient rendering for large data sets.

## How to Install and Run

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Open `index.html` in a browser or serve the project using a local dev server.

## Features Implemented

- Virtual canvas-based grid rendering
- Sticky row and column headers
- Cell selection and highlighting
- In-place editing with text input overlay
- Formula insertion and evaluation (SUM, AVG, COUNT, MIN, MAX)
- Copy/paste support for selected cells
- Undo/redo using command pattern
- Large dataset loading with virtualized drawing
- Summary bar showing count, sum, min, max, average

## Folder and Class Structure

- `src/`
  - `main.ts` — application entry point and grid initialization
  - `Grid.ts` — main grid controller, state, rendering lifecycle, and event wiring
  - `GridRenderer.ts` — canvas render logic for cells, headers, lines, selection, and summary updates
  - `GridLayout.ts` — layout math for offsets, visible range calculation, and spacer sizing
  - `GridEditor.ts` — in-cell editing, formula menu, and edit input positioning
  - `GridClipboard.ts` — copy/paste selection handling
  - `GridEvents.ts` — mouse event delegation and interaction handling
  - `GridKeyboard.ts` — keyboard event processing
  - `GridDoubleClick.ts` — double-click editor activation
  - `commands/` — undo/redo command classes
  - `models/` — core model classes like `Cell`, `DataStore`, `Dimension`, `Range`, `Selection`
  - `data/sampleData.ts` — sample record generation


### Component Responsibilities

- `main.ts`: bootstraps the grid, wires the canvas, and starts initialization.
- `Grid`: coordinates state, event wiring, rendering, and public actions such as undo/redo.
- `DataStore`: stores cell values in a sparse map keyed by row and column.
- `Selection`: tracks the active cell, row, column, or range selection mode.
- `CommandManager`: maintains undo/redo stacks for reversible actions.
- `GridRenderer`: draws the canvas viewport, headers, selection outline, and summary content.
- `GridLayout`: computes offsets, visible ranges, and resize geometry.
- `GridEditor`: handles edit input state, formula insertion, and edit application.
- `GridKeyboard`: responds to keyboard navigation, copy/paste, and undo/redo shortcuts.
- `GridMouse`: handles pointer selection and resize interactions.
- `GridClipboard`: copies and pastes cell values between selections.
- `GridDoubleClick`: opens editing mode or selects full rows/columns on double click.

## How OOP Concepts Are Applied

- Encapsulation: `Grid`, `DataStore`, `Selection`, and command classes hide implementation details behind methods.
- Abstraction: rendering, layout, editing, clipboard, and event handling are separated into focused modules.
- Inheritance: class hierarchies are limited, but object behavior is organized using class-based models and reusable helpers.
- Polymorphism: command classes implement a shared `Command` interface to provide interchangeable undo/redo operations.

## How SOLID Principles Are Applied

- Single Responsibility: each module handles one concern, e.g. `GridRenderer` for drawing, `GridLayout` for geometry, `GridEditor` for editing.
- Open/Closed: behavior can be extended by adding new command types or render features without changing existing class logic.
- Liskov Substitution: commands implementing `Command` can be used interchangeably by `CommandManager`.
- Interface Segregation: small interfaces like `Command` keep behavior narrow and specific.
- Dependency Inversion: high-level grid logic depends on abstractions such as command interfaces and data store APIs rather than concrete implementations.

## How Command Pattern Is Applied

- `Command` interface defines `execute()` and `undo()`.
- `EditCellCommand`, `ResizeColumnCommand`, `ResizeRowCommand`, and `BatchEditCommand` encapsulate individual changes.
- `CommandManager` maintains undo and redo stacks, executes commands, and reverses actions reliably.

## How Virtual Rendering Works

- The canvas is sized to the wrapper element and uses `window.devicePixelRatio` for crisp rendering.
- `GridLayout` computes visible row and column ranges based on scroll position.
- Only visible cells and grid lines are drawn, reducing rendering work for large tables.
- Sticky headers are rendered separately so row/column labels remain visible while scrolling.

## How Data Is Generated and Loaded

- `data/sampleData.ts` generates sample records with id, first name, last name, age, and salary.
- `Grid.loadData()` formats these records and loads them into `DataStore`.
- `DataStore` stores values in a `Map` keyed by `row:col`, enabling sparse data handling.

## How Undo/Redo Works

- User actions are wrapped in command objects and passed to `CommandManager.execute()`.
- `CommandManager` pushes executed commands onto the undo stack and clears the redo stack.
- `undo()` pops a command from undo stack, calls `undo()`, then pushes it onto redo stack.
- `redo()` pops from redo stack, calls `execute()`, and pushes back onto undo stack.

## Test Cases Covered

- Build and compile validation via TypeScript build pipeline
- Grid rendering and resize behavior under device pixel ratio scaling
- Header stacking and line drawing for sticky row/column headers
- Cell editing input positioning and visibility
- Formula evaluation for supported aggregate functions
- Undo/redo for edit and resize commands
- Copy/paste selection handling and clipboard transfer

## Performance Observations

- Virtual rendering keeps canvas work proportional to visible rows/columns, not total data size.
- Large grids with thousands of rows are supported because offscreen cells are not drawn.
- The current implementation still draws each visible cell individually, so extremely large viewport sizes may increase render time.
- Data store access is fast using a `Map`, but additional memoization could improve formula-heavy workloads.

## Accessibility Considerations

- The canvas includes keyboard event handling for navigation and editing.
- The text input editor uses native focus, allowing keyboard users to type normally.
- The summary bar is marked with `aria-live="polite"` for screen reader updates.
- Additional ARIA roles and focus management can be added for better accessibility.

## Scenario Matrix

| # | Scenario | Expected Result | Actual Result |
|---|---|---|---|
| 1 | Application loads for the first time | The grid renders with headers, sample data, and a selected starting cell | The app initializes the canvas, loads sample data, and renders the grid successfully |
| 2 | User clicks a cell | The clicked cell becomes the active selection | The selection model updates and the canvas redraws the active range |
| 3 | User double-clicks a cell | The edit input opens for in-place editing | The double-click handler opens the editor and selects the cell |
| 4 | User double-clicks a column header | The full column is selected and the header is highlighted | Column selection is applied and the header highlight is drawn |
| 5 | User double-clicks a row header | The full row is selected and the header is highlighted | Row selection is applied and the header highlight is drawn |
| 6 | User presses Arrow keys | Selection moves to the adjacent cell and the view stays aligned | Keyboard navigation updates the active cell and scrolls it into view |
| 7 | User presses Enter on a selected cell | The edit input opens for the selected cell | Enter opens the editor when the grid is not already editing |
| 8 | User edits a cell with plain text | The value is stored and the summary updates | The value is committed through the edit command and the renderer refreshes |
| 9 | User enters a formula such as =SUM(A1:A3) | The formula computes and stores the result | Formula evaluation is supported for the implemented aggregate functions |
| 10 | User enters an invalid formula | An error state is shown and the cell stores an error marker | The grid records a formula error and displays it in the summary bar |
| 11 | User copies a selection | The clipboard contains the selected values | Copy handling stores the selected cell values for later paste |
| 12 | User pastes into a new target range | The values are inserted into the target cells | Paste logic writes clipboard contents into the selected region |
| 13 | User resizes a column by dragging its edge | The column width changes and the resize is undoable | The resize command updates the width and can be reversed via undo |
| 14 | User resizes a row by dragging its edge | The row height changes and the resize is undoable | The resize command updates the row height and can be reversed |
| 15 | User presses Ctrl/Cmd+Z after editing a cell | The previous edit is undone | Undo is handled via the command manager and the grid re-renders |
| 16 | User presses Ctrl/Cmd+Shift+Z after undo | The undone change is reapplied | Redo replays the command from the redo stack |
| 17 | User presses Ctrl/Cmd+Y after undo | The undone change is reapplied | Redo also works through the same command path |
| 18 | User selects a range by dragging | The range highlight covers the chosen cells | Drag selection updates the range and redraws the selection box |
| 19 | Summary bar updates after a selection change | The summary reflects the selected values | The selection summary is calculated and written to the summary bar |
| 20 | Scroll position changes | Visible cells and headers update correctly with the viewport | Rendering uses the current scroll offsets to draw the visible portion |

## Known Limitations and Next Improvements

- No built-in support for custom cell formatting, selection via keyboard, or merged cells.
- Formulas are limited to a small set of functions and do not support arbitrary expressions.
- Scrolling is based on browser scroll position rather than a dedicated virtual viewport.
- Improvements could include cell virtualization optimizations, better formula parsing, selection resizing, copy/paste with external clipboard, and richer accessibility support.
