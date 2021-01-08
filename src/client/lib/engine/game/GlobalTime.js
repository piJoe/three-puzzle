let time = 0;

export function getGlobalTime() {
    return time;
}
export function updateGlobalTime(t) {
    const delta = t - time;
    time = t;
    return delta;
}