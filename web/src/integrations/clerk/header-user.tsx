import {
    SignedIn,
    SignInButton,
    SignedOut,
    UserButton,
} from "@clerk/clerk-react";
import {
    isDemoEnvEnabled,
    isDemoEnabled,
    enableDemoMode,
} from "../../utils/demo";
import { Button } from "../../components/ui/button";

export default function HeaderUser() {
    return (
        <>
            <SignedIn>
                <UserButton />
            </SignedIn>
            <SignedOut>
                <div className="flex items-center gap-2">
                    {isDemoEnvEnabled() && !isDemoEnabled() && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                enableDemoMode();
                                window.location.assign("/dashboard");
                            }}
                        >
                            Demo
                        </Button>
                    )}
                    <SignInButton mode="modal">
                        <Button size="sm">Se connecter</Button>
                    </SignInButton>
                </div>
            </SignedOut>
        </>
    );
}
