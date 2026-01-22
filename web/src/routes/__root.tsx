import {
    HeadContent,
    Scripts,
    createRootRouteWithContext,
    useRouterState,
} from "@tanstack/react-router";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import Header from "../components/Header";
import DemoBanner from "../components/DemoBanner";
import Sidebar from "../components/Sidebar";
import ClerkProvider from "../integrations/clerk/provider";
import { Toaster } from "../components/ui/sonner";
import { disableDemoMode } from "../utils/demo";

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
                title: "Aulirya | L'agenda intelligent",
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
    const isLanding = useRouterState({
        select: (state) => state.location.pathname === "/",
    });

    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="bg-gray-100">
                <ClerkProvider>
                    <DemoModeSync />
                    {!isLanding && <DemoBanner />}
                    <SidebarContext.Provider
                        value={{
                            isOpen: isSidebarOpen,
                            setIsOpen: setIsSidebarOpen,
                        }}
                    >
                        {isLanding ? (
                            <main className="min-h-screen w-full">
                                {children}
                            </main>
                        ) : (
                            <>
                                <Header />
                                <div className="flex">
                                    <Sidebar />
                                    <main
                                        className={`px-8 pt-4 max-h-[calc(100vh-4rem)] flex flex-col gap-4  grow transition-all duration-300 ease-in-out overflow-scroll max-w-screen-2xl mx-auto `}
                                    >
                                        {children}
                                    </main>
                                </div>
                            </>
                        )}
                    </SidebarContext.Provider>
                    <Toaster />
                </ClerkProvider>
                <Scripts />
            </body>
        </html>
    );
}

function DemoModeSync() {
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (isSignedIn) {
            disableDemoMode();
        }
    }, [isSignedIn]);

    return null;
}
