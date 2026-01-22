import type { ReactNode } from "react";

import { PageLayout } from "@/components/PageLayout";

type MasterDetailPageLayoutProps = {
    header: ReactNode;
    list: ReactNode;
    pagination?: ReactNode;
    desktopSummary?: ReactNode;
    showDesktopSummary?: boolean;
    afterContent?: ReactNode;
};

export function MasterDetailPageLayout({
    header,
    list,
    pagination,
    desktopSummary,
    showDesktopSummary = true,
    afterContent,
}: MasterDetailPageLayoutProps) {
    return (
        <PageLayout header={header}>
            <div className="grid grid-cols-7 gap-6 m-0 grow">
                <div className="col-span-7 lg:col-span-4 xl:col-span-5 flex flex-col">
                    <div className="">
                        <div className="space-y-5">{list}</div>
                    </div>
                    {pagination}
                </div>
                {showDesktopSummary && desktopSummary ? (
                    <div className="space-y-4 hidden lg:block h-auto pr-3 lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28 self-start">
                        {desktopSummary}
                    </div>
                ) : null}
            </div>
            {afterContent}
        </PageLayout>
    );
}
