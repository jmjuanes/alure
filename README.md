# alure

> A primitive for building and managing floating elements in React, powered by composable middlewares.

![npm version](https://badgen.net/npm/v/alure?labelColor=1d2734&color=21bf81)
![license](https://badgen.net/github/license/jmjuanes/alure?labelColor=1d2734&color=21bf81)

Alure provides a simple and flexible system to display floating elements: dialogs, context menus, command palettes, tooltips, or any UI element that appears on top of your application. Instead of managing visibility state and positioning logic scattered across your components, alure centralises everything in a single provider and lets you compose behaviour through middleware.

## Installation

Add to your project using **yarn** or **npm**:

```bash
## install using yarn
$ yarn add alure

## install using npm
$ npm install alure
```

## Basic usage

Wrap your application with `AlureProvider` and place `AlureOutlet` where floating elements should be rendered (typically at the root level, just before the closing tag of your app).

```tsx
import { AlureProvider, AlureOutlet } from "alure";

const App = () => (
    <AlureProvider>
        <YourApp />
        <AlureOutlet />
    </AlureProvider>
);
```

Then use the `useAlure` hook anywhere in your component tree to open and close floating elements:

```tsx
import { useAlure, withOverlay, withCloseOnEsc } from "alure";
import { MyDialog } from "./MyDialog";

const OpenDialogButton = () => {
    const { open } = useAlure();

    return (
        <button onClick={() => open("my-dialog", {
            component: MyDialog,
            middlewares: [
                withOverlay({
                    closeOnClick: true,
                }),
                withCloseOnEsc(),
            ],
            context: {
                title: "Hello from alure",
            },
        })}>
            Open dialog
        </button>
    );
};
```

Inside `MyDialog`, use `useAlure` to access the element context and close itself:

```tsx
import { useAlure } from "alure";

const MyDialog = () => {
    const { close, getContext } = useAlure();
    const { title } = getContext();

    return (
        <div className="dialog">
            <h2>{title}</h2>
            <button onClick={() => close()}>Close</button>
        </div>
    );
};
```

## API

### `AlureProvider`

The root provider. Wrap your application with it to enable alure.

```tsx
<AlureProvider>
    {children}
</AlureProvider>
```

### `AlureOutlet`

Renders all active floating elements. Place it at the root of your application, outside your main content.

```tsx
<AlureOutlet />
```

### `useAlure`

Hook to interact with the alure manager. Returns the following methods:

#### `open(id, element)`

Opens a floating element.

| Parameter | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the element. |
| `element.component` | `ElementType` | The React component to render. Required. |
| `element.middlewares` | `AlureMiddleware[]` | Optional array of middleware to compose behaviour. |
| `element.context` | `any` | Optional data passed to the element, accessible via `getContext()`. |

#### `close(id?)`

Closes a floating element. When called without an `id` from inside a floating element, it closes itself. When called from outside a floating element, an `id` is required.

#### `closeAll()`

Closes all active floating elements.

#### `getContext()`

Returns the context object passed when the element was opened. Only available inside a floating element.

### Middleware

Middleware are composable units that wrap a floating element to add positioning, behaviour, or visual decoration. They are applied in order, outermost first.

#### `withFixedPosition(options)`

Positions the element at a fixed coordinate on the screen.

| Option | Type | Description |
|---|---|---|
| `top` | `number \| string` | Distance from the top of the viewport. |
| `left` | `number \| string` | Distance from the left of the viewport. |
| `className` | `string` | Optional CSS class for the container. |
| `style` | `CSSProperties` | Optional additional inline styles for the container. |

#### `withOverlay(options?)`

Renders a full-screen overlay behind the floating element.

| Option | Type | Description |
|---|---|---|
| `closeOnClick` | `boolean` | If `true`, closes the element when the overlay is clicked. |
| `className` | `string` | Optional CSS class for the overlay. |
| `style` | `CSSProperties` | Optional additional inline styles. |

#### `withCloseOnEsc()`

Closes the floating element when the user presses the `Escape` key.

#### `withPortal(options?)`

Renders the floating element inside a React portal, detaching it from the current DOM tree.

| Option | Type | Description |
|---|---|---|
| `target` | `HTMLElement` | Target DOM node. Defaults to `document.body`. |
| `key` | `string` | Optional React key for the portal. |

## Examples

### Context menu

```tsx
import { useCallback } from "react";
import { useAlure, withFixedPosition, withCloseOnEsc } from "alure";
import { ContextMenu } from "./ContextMenu";

const Canvas = () => {
    const { open } = useAlure();

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        open("context-menu", {
            component: ContextMenu,
            middlewares: [
                withFixedPosition({
                    top: event.clientY,
                    left: event.clientX,
                }),
                withCloseOnEsc(),
            ],
            context: {
                position: {
                    top: event.clientY,
                    left: event.clientX,
                },
            },
        });
    }, [open]);

    return (
        <div onContextMenu={handleContextMenu}>Right-click me</div>
    );
};
```

### Dialog with overlay

```tsx
import { useAlure, withOverlay, withCloseOnEsc } from "alure";
import { ExportDialog } from "./ExportDialog";

const ExportButton = () => {
    const { open } = useAlure();

    return (
        <button onClick={() => open("export-dialog", {
            component: ExportDialog,
            middlewares: [
                withOverlay({ closeOnClick: true }),
                withCloseOnEsc(),
            ],
        })}>
            Export
        </button>
    );
};
```

### Command palette

```tsx
import { useAlure, withCloseOnEsc } from "alure";
import { CommandsPalette } from "./CommandsPalette";

const useCommandsPalette = () => {
    const { open, close } = useAlure();

    return {
        openPalette: () => open("commands-palette", {
            component: CommandsPalette,
            middlewares: [withCloseOnEsc()],
        }),
        closePalette: () => close("commands-palette"),
    };
};
```

### Custom middleware

You can build your own middleware by returning an object with a `wrapper` component:

```tsx
import type { AlureMiddleware } from "alure";
import type { PropsWithChildren } from "react";

const withFadeIn = (): AlureMiddleware => ({
    wrapper: ({ children }: PropsWithChildren) => (
        <div style={{ animation: "fadeIn 150ms ease-out" }}>
            {children}
        </div>
    ),
});
```

## License

Alure is release under the [MIT License](./LICENSE).
