import { useAuth } from "@clerk/clerk-react";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { isDemoEnabled } from "../utils/demo";

export const Route = createFileRoute("/_protected")({
    component: RouteComponent,
});

function RouteComponent() {
    const user = useAuth();

    if (isDemoEnabled()) {
        return <Outlet />;
    }

    if (!user.isSignedIn) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}
