import {
    createElement,
    createContext,
    useContext,
    useState,
    useCallback,
    Fragment,
} from "react";
import { createPortal } from "react-dom";
import type {
    JSX,
    ElementType,
    PropsWithChildren,
    ComponentType,
    ReactNode,
    CSSProperties,
} from "react";

// @description to generate the composition tree from an array of React components
// @param {array} components An array of React components to build the tree
// @param {ReactNode} children The children content of the tree
const composeTree = (components: ComponentType[], children: ReactNode): JSX.Element => {
    return (components || []).reduceRight((acc, Comp) => createElement(Comp, null, acc), children) as JSX.Element;
};

export type AlureMiddleware = {
    wrapper?: ComponentType;
};

export type AlureElement = {
    id: string;
    component: ElementType;
    context?: any;
    middlewares?: AlureMiddleware[];
};

export type AlureManager = {
    open: (id: string, element: Partial<AlureElement>) => void;
    close: (id?: string) => void;
    closeAll: () => void;
    getContext: () => any;
};

type AlureContextValue = {
    elements: AlureElement[];
    setElements: (update: (prev: AlureElement[]) => AlureElement[]) => void;
};

const AlureContext = createContext<AlureContextValue | null>(null);
const AlureElementContext = createContext<AlureElement | null>(null);

// @description hook to access to alure manager
// @returns {object} alure object
// @returns {function} alure.open function to show an alure element
// @returns {function} alure.close function to remove an alure element
export const useAlure = (): AlureManager => {
    const context = useContext(AlureContext);
    const elementContext = useContext(AlureElementContext);
    if (!context) {
        throw new Error("Cannot call 'useAlure' outside AlureProvider");
    }

    const { setElements } = context;

    // callback to show an alure element
    const open = useCallback((elementId: string, element: Partial<AlureElement>) => {
        if (!element.component) {
            throw new Error("Cannot display alure element without 'component'");
        }
        setElements((prevElements: AlureElement[]) => {
            return [
                ...prevElements,
                {
                    ...element,
                    id: elementId,
                    context: element?.context || {},
                } as AlureElement,
            ];
        });
    }, [setElements]);

    // callback to remove the provided alure element
    const close = useCallback((elementId?: string) => {
        // 1. if the user is not calling this method with the ID and we are not inside a floating element
        if (!elementId && !elementContext) {
            throw new Error("Cannot call alure.close() without an id outside a floating element");
        }
        // 2. get the element ID to close.
        // If the user has not called this method with an ID, use the current floating element id
        const elementIdToClose = elementId || elementContext?.id;
        setElements((prevElements: AlureElement[]) => {
            return prevElements.filter(element => element.id !== elementIdToClose);
        });
    }, [setElements]);

    // callback to clear all alure elements
    const closeAll = useCallback(() => setElements(() => [] as AlureElement[]), [setElements]);

    // callback to access to the context of the current element
    // note that this method only works when using useAlure hook inside a floating element
    const getContext = useCallback(() => {
        if (!elementContext) {
            throw new Error("Cannot call 'getContext' outside a floating element.");
        }
        return elementContext?.context || {};
    }, [elementContext]);

    return { open, close, closeAll, getContext };
};

// @description main component
// @param {object} props React props
// @param {React Children} props.children React children to render
export const AlureProvider = (props: PropsWithChildren): JSX.Element => {
    const [elements, setElements] = useState<AlureElement[]>([] as AlureElement[]);
    return (
        <AlureContext.Provider value={{ elements, setElements }}>
            {props.children}
        </AlureContext.Provider>
    );
};

// internal wrapper to access to managers for the alure elements
const AlureElementWrapper = (props: { element: AlureElement }): JSX.Element => {
    const Component: ElementType = props.element.component;
    const middlewaresComponents: ComponentType[] = (props.element.middlewares || [])
        .filter((middleware: AlureMiddleware) => !!middleware.wrapper)
        .map((middleware: AlureMiddleware) => middleware.wrapper as ComponentType);

    return (
        <AlureElementContext.Provider value={props.element}>
            {composeTree(middlewaresComponents, <Component />)}
        </AlureElementContext.Provider>
    );
};

// export component to render content of the alure elements
export const AlureOutlet = (): JSX.Element => {
    const context = useContext(AlureContext);
    if (!context) {
        throw new Error("Component AlureOutlet can not be used outside <AlureProvider>");
    }
    const { elements } = context;
    return (
        <Fragment>
            {(elements || []).map((element: AlureElement, index: number) => {
                return (
                    <AlureElementWrapper
                        key={`alure:${index}:${element.id}`}
                        element={element}
                    />
                );
            })}
        </Fragment>
    );
};

// @description middleware to set a custom position for the floating element
export const withFixedPosition = (
    options: {
        top: number | string;
        left: number | string;
        className?: string;
        style?: CSSProperties;
        testid?: string;
    },
): AlureMiddleware => {
    return {
        wrapper: (props: PropsWithChildren): JSX.Element => {
            const style: CSSProperties = {
                top: typeof options.top === "number" ? options.top + "px" : options.top,
                left: typeof options.left === "number" ? options.left + "px" : options.left,
                position: "fixed",
                ...options.style,
            };
            return (
                <div data-testid={options.testid} className={options.className} style={style}>
                    {props.children}
                </div>
            );
        },
    };
};

// @description middleware to display the floating element in a portal
export const withPortal = (
    options?: {
        key?: string;
        target?: HTMLElement,
    },
): AlureMiddleware => {
    return {
        wrapper: (props: PropsWithChildren): JSX.Element => {
            return createPortal([
                <Fragment key={options?.key ?? "alure:middleware:portal"}>{props.children}</Fragment>,
            ], options?.target ?? document.body);
        },
    };
};

// @description middleware to display an overlay with the floating element
export const withOverlay = (
    options?: {
        className?: string;
        style?: CSSProperties;
        testid?: string;
        closeOnClick?: boolean;
    },
): AlureMiddleware => {
    return {
        wrapper: (props: PropsWithChildren): JSX.Element => {
            const { close } = useAlure();
            return (
                <Fragment>
                    <div
                        data-testid={options?.testid}
                        className={options?.className}
                        style={{
                            position: "fixed",
                            width: "100%",
                            height: "100%",
                            top: "0",
                            left: "0",
                            ...options?.style,
                        } as CSSProperties}
                        onClick={() => {
                            if (options?.closeOnClick) {
                                close();
                            }
                        }}
                    />
                    {props.children}
                </Fragment>
            );
        },
    };
};
