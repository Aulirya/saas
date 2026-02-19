import ClerkHeader from "../integrations/clerk/header-user.tsx";

export default function Header() {
    return (
        <>
            <header className="h-16 p-4  top-0 left-0 right-0 flex items-center bg-white text-gray border border-bottom justify-between z-50">
                <div className="flex flex-row items-center">
                    <h1 className="text-xl font-semibold">
                        <img
                            src="/logo_aulirya_text.svg"
                            alt="Aulirya Logo"
                            className="h-10"
                        />
                    </h1>
                </div>

                <div className="flex items-center gap-3 ml-6">
                    <ClerkHeader />
                </div>
            </header>
        </>
    );
}
