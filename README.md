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

## Known Limitations and Next Improvements

- No built-in support for custom cell formatting, selection via keyboard, or merged cells.
- Formulas are limited to a small set of functions and do not support arbitrary expressions.
- Scrolling is based on browser scroll position rather than a dedicated virtual viewport.
- Improvements could include cell virtualization optimizations, better formula parsing, selection resizing, copy/paste with external clipboard, and richer accessibility support.
