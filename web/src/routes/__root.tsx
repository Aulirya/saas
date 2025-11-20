import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createContext, useContext, useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ClerkProvider from "../integrations/clerk/provider";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }
    return context;
};

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "TanStack Start Starter",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
    }),

    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="bg-gray-100">
                <ClerkProvider>
                    <SidebarContext.Provider
                        value={{
                            isOpen: isSidebarOpen,
                            setIsOpen: setIsSidebarOpen,
                        }}
                    >
                        <Header />
                        <div className="flex">
                            <Sidebar />
                            <main
                                className={`px-4 lg:p-6 pb-6 pt-16 max-h-[calc(100vh-4rem)] flex flex-col gap-4  grow transition-all duration-300 ease-in-out overflow-scroll `}
                            >
                                {children}
                            </main>
                        </div>
                    </SidebarContext.Provider>
                    {/* <TanStackDevtools
                        config={{
                            position: "bottom-right",
                        }}
                        plugins={[
                            {
                                name: "Tanstack Router",
                                render: <TanStackRouterDevtoolsPanel />,
                            },
                            TanStackQueryDevtools,
                        ]}
                    /> */}
                </ClerkProvider>
                <Scripts />
            </body>
        </html>
    );
}
