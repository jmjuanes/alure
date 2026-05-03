import { useEffect, Fragment } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import {
    AlureProvider,
    AlureOutlet,
    useAlure,
    withFixedPosition,
    withPortal,
    withOverlay,
    withDismiss,
} from "./index.tsx";
import "@testing-library/jest-dom";
import type { PropsWithChildren } from "react";

const TestComponent = () => {
    return (
        <div data-testid="test-element">Floating Content</div>
    );
};

const HookCaller = ({ onMount }: { onMount: (manager: any) => void }) => {
    const manager = useAlure();
    useEffect(() => {
        onMount(manager);
    }, [onMount, manager]);
    return null;
};

describe("Alure", () => {
    describe("when using outside AlureProvider", () => {
        let consoleSpy: jest.SpyInstance;

        beforeAll(() => {
            consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        });

        afterAll(() => {
            consoleSpy.mockRestore();
        });

        it("should throw error when useAlure is used outside AlureProvider", () => {
            expect(() => {
                render(<HookCaller onMount={() => { }} />);
            }).toThrow("Cannot call 'useAlure' outside AlureProvider");
        });

        it("should throw error when AlureOutlet is used outside AlureProvider", () => {
            expect(() => {
                render(<AlureOutlet />);
            }).toThrow("Component AlureOutlet can not be used outside <AlureProvider>");
        });
    });

    describe("when using the useAlure hook", () => {
        let alureManager: any;

        beforeEach(() => {
            render(
                <AlureProvider>
                    <HookCaller onMount={(m) => { alureManager = m; }} />
                    <AlureOutlet />
                </AlureProvider>
            );
        });

        it("should open and render a floating element", () => {
            act(() => {
                alureManager.open("test-id", { component: TestComponent });
            });

            expect(screen.getByTestId("test-element")).toBeInTheDocument();
            expect(screen.getByText("Floating Content")).toBeInTheDocument();
        });

        it("should close a floating element by id", () => {
            act(() => {
                alureManager.open("test-id", { component: TestComponent });
            });
            expect(screen.getByTestId("test-element")).toBeInTheDocument();

            act(() => {
                alureManager.close("test-id");
            });
            expect(screen.queryByTestId("test-element")).not.toBeInTheDocument();
        });

        it("should close all floating elements", () => {
            act(() => {
                alureManager.open("id-1", { component: TestComponent });
                alureManager.open("id-2", { component: TestComponent });
            });
            expect(screen.getAllByTestId("test-element")).toHaveLength(2);

            act(() => {
                alureManager.closeAll();
            });
            expect(screen.queryByTestId("test-element")).not.toBeInTheDocument();
        });

        it("should throw error if opening without a component", () => {
            expect(() => {
                act(() => {
                    alureManager.open("test-id", {});
                });
            }).toThrow("Cannot display alure element without 'component'");
        });

        it("should allow accessing to the context provided to a floating element", () => {
            let elementManager: any;
            let contextValue: any;
            act(() => {
                alureManager.open("test", {
                    component: () => (
                        <HookCaller onMount={m => elementManager = m} />
                    ),
                    context: {
                        foo: "bar",
                    },
                });
            });

            act(() => {
                contextValue = elementManager.getContext()?.foo;
            });
            expect(contextValue).toEqual("bar");
        });

        it("should allow closing the floating element", () => {
            let elementManager: any;
            act(() => {
                alureManager.open("test", {
                    component: () => (
                        <Fragment>
                            <HookCaller onMount={m => elementManager = m} />
                            <div>Floating Content</div>
                        </Fragment>
                    ),
                });
            });
            expect(screen.getByText("Floating Content")).toBeInTheDocument();

            act(() => {
                elementManager.close();
            });
            expect(screen.queryByText("Floating Content")).not.toBeInTheDocument();
        });

        it("should throw an error when registering the same element", () => {
            act(() => {
                alureManager.open("test", {
                    component: () => (
                        <span>Floating Content</span>
                    ),
                });
            });
            expect(screen.getByText("Floating Content")).toBeInTheDocument();

            expect(() => {
                act(() => {
                    alureManager.open("test", {
                        component: () => (
                            <span>Hello world</span>
                        ),
                    });
                });
            }).toThrow("There is a floating element alerady registered with the id 'test'");
        });
    });

    describe("middlewares", () => {
        let alureManager: any;

        beforeEach(() => {
            render(
                <AlureProvider>
                    <HookCaller onMount={(m) => { alureManager = m; }} />
                    <AlureOutlet />
                </AlureProvider>
            );
        });

        describe("custom middlewares", () => {
            it("should support adding custom middlewares", () => {
                const customMiddleware = {
                    wrapper: (props: PropsWithChildren) => {
                        return (
                            <div data-testid="test-middleware">
                                {props.children}
                            </div>
                        );
                    },
                };

                act(() => {
                    alureManager.open("text-id", {
                        component: TestComponent,
                        middlewares: [customMiddleware],
                    });
                });

                expect(screen.getByTestId("test-element")).toBeInTheDocument();
                expect(screen.getByTestId("test-middleware")).toBeInTheDocument();
            });
        });

        describe("withFixedPosition", () => {
            it("should include the provided position as CSS style", () => {
                act(() => {
                    alureManager.open("test-id", {
                        component: TestComponent,
                        middlewares: [
                            withFixedPosition({
                                top: 100,
                                left: 100,
                                testid: "middleware:fixed-position",
                            }),
                        ],
                    });
                });
                expect(screen.getByTestId("middleware:fixed-position").style.top).toEqual("100px");
                expect(screen.getByTestId("middleware:fixed-position").style.left).toEqual("100px");
                expect(screen.getByTestId("middleware:fixed-position").style.position).toEqual("fixed");
            });
        });

        describe("withPortal", () => {
            it("should display content in the document", () => {
                act(() =>{
                    alureManager.open("test-id", {
                        component: TestComponent,
                        middlewares: [
                            withPortal(),
                        ],
                    });
                });
                expect(screen.getByTestId("test-element")).toBeInTheDocument();
            });
        });

        describe("withOverlay", () => {
            it("should display an overlay element", () => {
                act(() => {
                    alureManager.open("test-id", {
                        component: TestComponent,
                        middlewares: [
                            withOverlay({
                                testid: "middleware:overlay",
                            }),
                        ],
                    });
                });
                expect(screen.getByTestId("middleware:overlay")).toBeInTheDocument();
                expect(screen.getByTestId("middleware:overlay").style.position).toEqual("fixed");
            });

            it("should allow to customize the overlay", () => {
                act(() => {
                    alureManager.open("test-id", {
                        component: TestComponent,
                        middlewares: [
                            withOverlay({
                                testid: "middleware:overlay",
                                className: "test-css",
                                style: {
                                    backgroundColor: "red",
                                },
                            }),
                        ],
                    });
                });
                expect(screen.getByTestId("middleware:overlay")).toBeInTheDocument();
                expect(screen.getByTestId("middleware:overlay").className).toEqual("test-css");
                expect(screen.getByTestId("middleware:overlay").style.backgroundColor).toEqual("red");
            });

            it("should close the overlay when clicking on it", () => {
                act(() => {
                    alureManager.open("test-id", {
                        component: TestComponent,
                        middlewares: [
                            withOverlay({
                                testid: "middleware:overlay",
                                closeOnClick: true,
                            }),
                        ],
                    });
                });
                expect(screen.getByTestId("middleware:overlay")).toBeInTheDocument();

                act(() => {
                    fireEvent.click(screen.getByTestId("middleware:overlay"));
                });
                expect(screen.queryByTestId("middleware:overlay")).not.toBeInTheDocument();
            });
        });

        describe("withDismiss", () => {
            it("should close the floating element when the Escape key is pressed", () => {
                act(() => {
                    alureManager.open("test", {
                        component: TestComponent,
                        middlewares: [
                            withDismiss(),
                        ],
                    });
                });
                expect(screen.getByText("Floating Content")).toBeInTheDocument();

                act(() => {
                    fireEvent.keyDown(screen.getByText("Floating Content"), { key: "Escape" });
                });
                expect(screen.queryByText("Floating Content")).not.toBeInTheDocument();
            });
        });
    });
});
