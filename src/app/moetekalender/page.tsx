import CalendarContainer from "~/app/moetekalender/CalendarContainer";

export default function Moetekalender({
    params,
    searchParams,
}: {
    params: Promise<{ enhet: string }>;
    searchParams: Promise<{ [key: string]: string }>;
}) {
    return <CalendarContainer />;
}