function pad2(n:number){
    return String(n).padStart(2, "0");
}

// return "YYYY-MM-DD" using UTC calendar date
export function formatUTCDate(d: Date): string {
    const yyyy = d.getUTCFullYear();
    const mm = pad2(d.getUTCMonth()+1); // getUtcMonth is zero based
    const dd = pad2(d.getUTCDate())
    return `${yyyy}-${mm}-${dd}`;
}

export function getTodayUTCDate(): string {
    return formatUTCDate(new Date());
}

export function getYesterdayUTCDate(): string {
    const now = new Date();
    now.setUTCDate(now.getUTCDate()-1);
    return formatUTCDate(now)
}