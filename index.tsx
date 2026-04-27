import { createContext, useContext, useState, useCallback, Fragment } from "react";
// import { createPortal } from "react-dom";
import type { JSX, ElementType, PropsWithChildren } from "react";

// const composeTree = (components: ComponentType[], children: ReactNode): JSX.Element => {
//     return (components || []).reduceRight((acc, Component) => createElement(Component, null, acc), children) as JSX.Element;
// };

export type AlureElement = {
    id: string;
    component: ElementType;
};

export type AlureManager = {
    open: (id: string, element: Partial<AlureElement>) => void;
    close: (id?: string) => void;
    closeAll: () => void;
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
                Object.assign({}, element, { id: elementId }) as AlureElement,
            ];
        });
    }, [setElements]);

    // callback to remove the provided alure element
    const close = useCallback((elementId?: string) => {
        setElements((prevElements: AlureElement[]) => {
            return prevElements.filter(element => element.id !== elementId);
        });
    }, [setElements]);

    // callback to clear all alure elements
    const closeAll = useCallback(() => setElements(() => [] as AlureElement[]), [setElements]);

    return { open, close, closeAll };
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
    return (
        <AlureElementContext.Provider value={props.element}>
            <Component />
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
