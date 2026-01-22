const DEMO_ENV_ENABLED = import.meta.env.VITE_DEMO_MODE === "true";

export const isDemoEnvEnabled = () => DEMO_ENV_ENABLED;

export const isDemoEnabled = () => {
    if (!DEMO_ENV_ENABLED || typeof window === "undefined") {
        return false;
    }
    return window.localStorage.getItem("demo-mode") === "true";
};

export const enableDemoMode = () => {
    if (DEMO_ENV_ENABLED && typeof window !== "undefined") {
        window.localStorage.setItem("demo-mode", "true");
    }
};

export const disableDemoMode = () => {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem("demo-mode");
    }
};
