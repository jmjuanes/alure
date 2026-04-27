import { createElement, createContext, useContext, useState, useCallback, Fragment } from "react";
// import { createPortal } from "react-dom";
import type { ReactNode, JSX, ComponentType, ElementType, PropsWithChildren, CSSProperties } from "react";

// const composeTree = (components: ComponentType[], children: ReactNode): JSX.Element => {
//     return (components || []).reduceRight((acc, Component) => createElement(Component, null, acc), children) as JSX.Element;
// };

export type FloatingElement = {
    id: string;
    component: ElementType;
};

export type FloatorManager = {
    showFloatingElement: (id: string, element: Partial<FloatingElement>) => void;
    removeFloatingElement: (id?: string) => void;
    removeAllFloatingElements: () => void;
};

const FloatingContext = createContext(null);
const FloatingElementContext = createContext<FloatingElement | null>(null);

// @description hook to access to floating manager
// @returns {object} floating object
// @returns {function} floating.showFloatingElement function to show a floating element
// @returns {function} surface.removeFloatingElement function to remove a floating element
export const useFloator = (): FloatorManager => {
    const { elements, setElements } = useContext(FloatingContext) || { elements: null, setElements: null };
    // const { id, context } = useContext(FloatingElementContext) || { id: null, context: null };
    if (!elements || !setElements) {
        throw new Error("Cannot call 'useFloator' outside FloatorProvider");
    }

    // callback to show a floating element
    const showFloatingElement = useCallback((elementId: string, element: Partial<FloatingElement>) => {
        if (!element.component) {
            throw new Error("Cannot display floating element without 'component'");
        }
        setElements((prevElements: FloatingElement[]) => {
            return [
                ...prevElements,
                Object.assign({}, element, { id: elementId }) as FloatingElement,
            ];
        });
    }, [setElements]);

    // callback to remove the provided floating element
    const removeFloatingElement = useCallback((elementId?: string) => {
        setElements((prevElements: FloatingElement[]) => {
            return prevElements.filter(element => element.id !== elementId);
        });
    }, [setElements]);

    // callback to clear all floating elements
    const removeAllFloatingElements = useCallback(() => setElements([] as FloatingElement[]), [setElements]);

    return { showFloatingElement, removeFloatingElement, removeAllFloatingElements };
};

// @description main component
// @param {object} props React props
// @param {React Children} props.children React children to render
export const Floator = (props: PropsWithChildren): JSX.Element => {
    const [elements, setElements] = useState<FloatingElement[]>([] as FloatingElement[]);

    return (
        <FloatingContext.Provider value={{ elements, setElements }}>
            {props.children}
        </FloatingContext.Provider>
    );
};

// internal wrapper to access to managers for the floating elements
const FloatingElementWrapper = (props: { element: FloatingElement }): JSX.Element => {
    const Component: ElementType = props.element.component;
    return (
        <FloatingElementContext.Provider value={props.element}>
            <Component />
        </FloatingElementContext.Provider>
    );
};

// export component to render content of the floating elements
export const FloatorSlot = (): JSX.Element => {
    const { elements } = useContext(FloatingContext) || { elements: null };
    if (!elements) {
        throw new Error("Component FloatorSlot can not be used outside <Floator>");
    }
    return (
        <Fragment>
            {(elements || []).map((element: FloatingElement, index: number) => {
                return (
                    <FloatingElementWrapper
                        key={`floating:${index}:${element.id}`}
                        element={element}
                    />
                );
            })}
        </Fragment>
    );
};
