export function startOfWeek(date: Date) {
    const d = new Date(date);
        const day = d.getDay(); // 0 = Sun ... 6 = Sat
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        return new Date(d.setDate(diff));
    }