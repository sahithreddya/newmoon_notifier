type AstroEvents = {
    newmoon: Date,
    sunrise: Date,
    sunset: Date,
    moonrise: Date,
    moonset: Date,
}

type DayEvent = {
    type: "sunrise" | "sunset" | "moonrise" | "moonset" | "startOfDay" | "endOfDay" | string;
    time: number; // Time in minutes (0-1440)
    order: number; // Order of occurrence (1-4)
};

type DayWindow = {
    start: number; // Start time of the window (0-1440)
    end: number; // End time of the window (0-1440)
    illuminatedSky: 'daylight' | 'moonlight' | 'dark';
};

export type { AstroEvents, DayEvent, DayWindow };