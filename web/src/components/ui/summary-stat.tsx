interface SummaryStatProps {
    label: string;
    value: string;
}

export function SummaryStat({ label, value }: SummaryStatProps) {
    return (
        <div className="rounded-lg flex flex-row justify-between">
            <p className="text-xs tracking-wide">{label}</p>
            <p className="text-xs font-semibold">{value}</p>
        </div>
    );
}
