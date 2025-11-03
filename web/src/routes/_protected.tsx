import { RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  component: RouteComponent,
});

function RouteComponent() {
  const user = useAuth();

  if (!user.isSignedIn) {
    return <RedirectToSignIn />;
  }
  return <Outlet />;
}
