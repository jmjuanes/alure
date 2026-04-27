import { useEffect } from "react";
import { render, screen, act } from "@testing-library/react";
import { AlureProvider, AlureOutlet, useAlure } from "./index.tsx";
import "@testing-library/jest-dom";

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
    });
});
