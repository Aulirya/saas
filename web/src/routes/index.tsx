import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { enableDemoMode, isDemoEnabled, isDemoEnvEnabled } from "@/utils/demo";
import { Calendar, BookOpenCheck, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
    component: LandingPage,
});

function LandingPage() {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (isSignedIn || isDemoEnabled()) {
            navigate({ to: "/dashboard", replace: true });
        }
    }, [isSignedIn, navigate]);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const { innerWidth, innerHeight } = window;
            const x = (event.clientX / innerWidth) * 100;
            const y = (event.clientY / innerHeight) * 100;
            document.documentElement.style.setProperty(
                "--landing-gradient-x",
                `${x}%`
            );
            document.documentElement.style.setProperty(
                "--landing-gradient-y",
                `${y}%`
            );
        };

        window.addEventListener("pointermove", handlePointerMove);
        return () =>
            window.removeEventListener("pointermove", handlePointerMove);
    }, []);

    return (
        <div className="landing-hero min-h-screen text-slate-900">
            <div className="landing-orb landing-orb--one" />
            <div className="landing-orb landing-orb--two" />
            <div className="landing-glow landing-glow--one" />
            <div className="landing-glow landing-glow--two" />
            <div className="landing-bubble landing-bubble--right" />
            <div className="landing-bubble landing-bubble--right-sm" />
            <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col px-10 py-8">
                <header className="flex items-center justify-between">
                    <img
                        src="/logo_aulirya_text.svg"
                        alt="Aulirya Logo"
                        className="h-10"
                    />
                    {isSignedIn ? (
                        <Button asChild>
                            <Link to="/dashboard">
                                Acceder au tableau de bord
                            </Link>
                        </Button>
                    ) : (
                        <SignInButton mode="modal">
                            <Button className="landing-cta">
                                Se connecter
                            </Button>
                        </SignInButton>
                    )}
                </header>

                <main className="flex flex-1 items-center">
                    <section className="landing-hero-grid grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="landing-hero-content flex flex-col">
                            <h1 className="landing-title text-4xl py-2 font-semibold text-slate-900 sm:text-5xl lg:text-[3.75rem]">
                                Aulirya simplifie votre organisation de cours.
                            </h1>
                            <div className="landing-tagline inline-flex items-center gap-2 px-4 py-2 pr-2 text-3xl font-semibold  text-indigo-900">
                                L'agenda intelligent pour les enseignants
                            </div>

                            <div className="landing-card landing-action--primary rounded-2xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur mt-6">
                                <h2 className="landing-action-title text-2xl font-semibold text-slate-900">
                                    Prêt a démarrer ?
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Choisissez votre mode en un clic.
                                </p>
                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    {isDemoEnvEnabled() && (
                                        <Button
                                            variant="default"
                                            className="landing-cta landing-cta-xl landing-fade-up"
                                            onClick={() => {
                                                enableDemoMode();
                                                navigate({ to: "/dashboard" });
                                            }}
                                        >
                                            Essayer la démo gratuitement
                                        </Button>
                                    )}
                                    <SignInButton mode="modal">
                                        <Button
                                            variant="outline"
                                            className="landing-cta-xl landing-fade-up landing-fade-up--delay"
                                        >
                                            Se connecter
                                        </Button>
                                    </SignInButton>
                                </div>
                            </div>
                            {!isDemoEnvEnabled() && (
                                <p className="text-sm text-slate-500">
                                    Le mode demo est desactive pour le moment.
                                </p>
                            )}
                        </div>

                        <div className="landing-card grid gap-4 rounded-3xl border border-white/80 bg-white/75 p-6 shadow-xl backdrop-blur">
                            <div className="landing-feature flex items-start gap-4 rounded-2xl border border-slate-100/60 bg-white/80 p-4">
                                <Calendar className="mt-1 h-5 w-5 text-indigo-600" />
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        Planning intelligent
                                    </h3>
                                    <p className="text-md text-slate-600">
                                        Visualisez votre semaine et adaptez vos
                                        leçons en quelques secondes.
                                    </p>
                                </div>
                            </div>
                            <div className="landing-feature landing-feature--delay flex items-start gap-4 rounded-2xl border border-slate-100/60 bg-white/80 p-4">
                                <BookOpenCheck className="mt-1 h-5 w-5 text-indigo-600" />
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        Suivi des programmes
                                    </h3>
                                    <p className="text-md text-slate-600">
                                        Gardez une vue claire sur la progression des cours.
                                    </p>
                                </div>
                            </div>
                            <div className="landing-feature landing-feature--delay-lg flex items-start gap-4 rounded-2xl border border-slate-100/60 bg-white/80 p-4">
                                <GraduationCap className="mt-1 h-5 w-5 text-indigo-600" />
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        Pilotage des classes
                                    </h3>
                                    <p className="text-md text-slate-600">
                                        Organisez vos classes, matières et
                                        groupes en un seul endroit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/70 pt-8 text-sm text-slate-500 md:flex-row">
                    <div className="flex flex-wrap items-center gap-4">
                        <span>Fonctionnalites</span>
                        <span>A propos</span>
                        <span>Contact</span>
                        <span>CGU</span>
                    </div>
                    <span>
                        © 2026 Aulirya – L'agenda intelligent des enseignants
                    </span>
                </footer>
            </div>
        </div>
    );
}
