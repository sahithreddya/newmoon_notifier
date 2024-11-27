import React from 'react'
import { IconType } from 'react-icons';
// import { Sunrise, Sunset, MoonIcon, MoonIcon as MoonOff } from 'lucide-react'
import { WiSunrise, WiSunset, WiMoonrise, WiMoonset } from "react-icons/wi";

type DayEvent = {
    newmoon: Date,
    sunrise: Date,
    sunset: Date,
    moonrise: Date,
    moonset: Date,
}

type Event = {
    type: "sunrise" | "sunset" | "moonrise" | "moonset" | "startOfDay" | "endOfDay";
    time: number; // Time in minutes (0-1440)
    order: number; // Order of occurrence (1-4)
};

type Window = {
    start: number; // Start time of the window (0-1440)
    end: number; // End time of the window (0-1440)
    illuminatedSky: 'daylight' | 'moonlit' | 'dark';
};

const calculateDarkSkyWindows = (t1: DayEvent, t2: DayEvent): [Event[], Window[]] => {

    const findEventBeforeNoon = (events: DayEvent): string => {
        const eventsBeforeNoon: [string, Date][] = Object.entries(events)
            .filter(([key, date]) => (date?.getHours() < 12) && (key !== "newmoon"))
            .sort((a, b) => a[1].getHours() - b[1].getHours());

        console.log("eventsBeforeNoon is ", eventsBeforeNoon);
        return eventsBeforeNoon.at(-1)[0]; //Returning event type as string
    }

    let events: Event[] = [
        { type: "sunrise", time: 0, order: 0 },
        { type: "sunset", time: 0, order: 0 },
        { type: "moonrise", time: 0, order: 0 },
        { type: "moonset", time: 0, order: 0 },
    ];

    // Coverting event times to total minutes, and adjusting it for the halves of each day
    const t1sunset = (t1.sunset.getHours() * 60 + t1.sunset.getMinutes()) - 720;
    const t1sunrise = (t1.sunrise.getHours() * 60 + t1.sunrise.getMinutes()) - 720;

    const t2sunset = (t2.sunset.getHours() * 60 + t2.sunset.getMinutes()) + 720;
    const t2sunrise = (t2.sunrise.getHours() * 60 + t2.sunrise.getMinutes()) + 720;

    const t1moonrise = t1?.moonrise && (t1.moonrise.getHours() * 60 + t1.moonrise.getMinutes()) - 720;
    const t1moonset = t1?.moonset && (t1.moonset.getHours() * 60 + t1.moonset.getMinutes()) - 720;

    const t2moonrise = t2?.moonrise && (t2.moonrise.getHours() * 60 + t2.moonrise.getMinutes()) + 720;
    const t2moonset = t2?.moonset && (t2.moonset.getHours() * 60 + t2.moonset.getMinutes()) + 720;

    // Calculating which half the sunrise and sunset belong to
    const sunrise = t1sunrise < 0 ? t2sunrise : t1sunrise;
    const sunset = t1sunset < 0 ? t2sunset : t1sunset;

    // Calculating which half the moonrise and moonset belong to
    const moonrise = t1moonrise && t1moonrise < 0 ? t2moonrise : (t1moonrise ?? t2moonrise);
    const moonset = t1moonset && t1moonset < 0 ? t2moonset : (t1moonset ?? t2moonset);

    //Calculating event before noon for t1    
    const eventBeforeNoon: string = findEventBeforeNoon(t1);


    // Assigning times
    events = [...events].map((e) => {
        let update: Event;

        if (e.type === "sunrise") {
            update = { ...e, time: sunrise };
        }
        else if (e.type === "sunset") {
            update = { ...e, time: sunset };
        }
        else if (e.type === "moonrise") {
            update = { ...e, time: moonrise };
        }
        else if (e.type === "moonset") {
            update = { ...e, time: moonset };
        }
        return update;
    })

    // Assigning order
    events = [...events].sort((a, b) => a.time - b.time).map((e, i) => { return { ...e, order: i + 1 } });

    // console.log("events are ", events);

    // Calculating windows
    const calculateWindows = (events: Event[], eventBeforeNoon: string): Window[] => {

        // Filtering events that are out of 1440 minute bounds
        const filteredEvents = [...events].filter((e) => (e?.time <= 1440));

        const windows: Window[] = [];

        // Add a "0" event to start the day and a "1440" event to end the day
        const eventsWithDayBounds: Event[] = [
            { type: "startOfDay", time: 0, order: 0 },
            ...filteredEvents,
            { type: "endOfDay", time: 1440, order: (filteredEvents.length + 1) },
        ];

        const sunriseOrder = eventsWithDayBounds.findIndex((e) => e.type === "sunrise");
        const sunsetOrder = eventsWithDayBounds.findIndex((e) => e.type === "sunset");
        const moonriseOrder = eventsWithDayBounds.findIndex((e) => e.type === "moonrise");
        const moonsetOrder = eventsWithDayBounds.findIndex((e) => e.type === "moonset");

        // Determine the state of illuminated of sky based on whether the moon or sun is in the sky
        const calcIlluminatedSky = (startEvent: Event, endEvent: Event): ('daylight' | 'moonlit' | 'dark') => {

            if (sunsetOrder < sunriseOrder) {
                if (startEvent.type === "startOfDay") {
                    return 'daylight';
                }
                if (startEvent.type === "sunrise" || endEvent.type === "sunset") {
                    return 'daylight';
                }
                if (startEvent.type === "moonrise") {
                    if (moonriseOrder > sunsetOrder && moonriseOrder < sunriseOrder) {
                        return 'moonlit';
                    }
                    else {
                        return 'daylight';
                    }
                }
                if (endEvent.type === "moonset") {
                    if (moonsetOrder > sunsetOrder && moonsetOrder < sunriseOrder) {
                        return 'moonlit';
                    }
                    else {
                        return 'daylight';
                    }
                }
            }
            else if (sunriseOrder < sunsetOrder) {
                if ((startEvent.type === "startOfDay") && (eventBeforeNoon === "sunrise")) { // Checking if previous window ended sun/moon illuminated
                    return 'daylight';
                }
                if ((startEvent.type === "startOfDay") && (eventBeforeNoon === "moonrise")) {
                    return 'moonlit';
                }
                if (startEvent.type === "sunrise" || endEvent.type === "sunset") {
                    return 'daylight';
                }
                if (startEvent.type === "moonrise") {
                    if (moonriseOrder > sunsetOrder || moonriseOrder < sunriseOrder) {
                        return 'moonlit';
                    }
                    else {
                        return 'daylight';
                    }
                }
                if (endEvent.type === "moonset") {
                    if (moonsetOrder > sunsetOrder || moonsetOrder < sunriseOrder) {
                        return 'moonlit';
                    }
                    else {
                        return 'daylight';
                    }
                }
            }
            return 'dark' // Sky is dark when none of the conditions satisfy
        };

        // Create windows based on the sorted events
        for (let i = 0; i < eventsWithDayBounds.length - 1; i++) {
            const currentEvent = eventsWithDayBounds[i];
            const nextEvent = eventsWithDayBounds[i + 1];

            const start = currentEvent.time;
            const end = nextEvent.time;

            windows.push({
                start: start % 1440, // Normalize to 0-1440 scale
                end: end === 1440 ? 1440 : end % 1440,     // Normalize to 0-1440 scale
                illuminatedSky: calcIlluminatedSky(currentEvent, nextEvent),
            });
        }

        console.log("events with day bounds are ", eventsWithDayBounds);
        console.log("windows are ", windows);
        return windows;
    }

    return [events as Event[], calculateWindows(events, eventBeforeNoon) as Window[]];
}

export default function DarkSkyVisualizer(d1, d2, key) {

    const [events, darkSkyWindows]: [Event[], Window[]] = calculateDarkSkyWindows(d1, d2);

    const getEventIcon = (type: string) => {
        switch (type) {
            case "sunrise":
                return <WiSunrise className="w-6 h-6 text-yellow-400" />;
            case "sunset":
                return <WiSunset className="w-6 h-6 text-orange-400" />;
            case "moonrise":
                return <WiMoonrise className="w-6 h-6 text-blue-400" />;
            case "moonset":
                return <WiMoonset className="w-6 h-6 text-gray-400" />;
        }
    }

    const TimelineEvent = ({ event, position }: { event: Event, position: number }) => {
        let actualTime = event.time > 720 ? event.time - 720 : event.time + 720;
        return (
            <div
                className="absolute transform -translate-x-1/2 top-[-24px]"
                style={{ left: `${position}%` }}
                aria-label={`${event.type} at ${event.time}`}
            >
                <div className="flex flex-col items-center">
                    {getEventIcon(event.type)}
                    <span className="text-xs mt-1">{`${Math.floor(actualTime / 60)}:${(actualTime % 60).toString().padStart(2, '0')}`}</span>
                </div>
            </div>
        )
    }

    const getWindowColor = (window: Window) => {
        switch (window.illuminatedSky) {
            case "daylight":
                return "bg-amber-300 opacity-60";
            case "moonlit":
                return "bg-cyan-300 opacity-60";
            case "dark":
                return "bg-gradient-to-r from-blue-950 from-15% via-indigo-950 to-blue-950 to-85%";
        }
    }

    return (
        <div className="max-w-3xl p-2 w-full flex flex-row gap-4" key={key}>
            <h4 className="text-base font-semibold text-end">{d1?.sunset.toLocaleString("default", { month: "short", day: "numeric" })}<br />12:00 PM</h4>
            <div className="relative h-12 bg-black overflow-visible flex-1">
                {darkSkyWindows?.map((window, index) => {
                    const startPercent = (window.start / 1440) * 100
                    const widthPercent = (Math.abs(window.end - window.start) / 1440) * 100

                    return (
                        <div
                            key={index}
                            className={`absolute h-full ${getWindowColor(window)} `}
                            style={{
                                left: `${startPercent}%`,
                                width: `${widthPercent}%`,
                            }}
                            aria-label={`Dark sky window from ${Math.floor(window.start / 60)}:${(window.start % 60).toString().padStart(2, '0')} to ${Math.floor(window.end / 60)}:${(window.end % 60).toString().padStart(2, '0')}`}
                        />
                    )
                })}
                <div className="absolute inset-0 opacity-30" />
                {events?.filter((event) => event.time <= 1440).map((event, index) => (
                    <TimelineEvent
                        key={index}
                        event={event}
                        position={(event.time / 1440) * 100}
                    />
                ))}
                {/* <div className="absolute bottom-0 w-full flex justify-between text-xs px-2 text-white">
                    <span>12:00</span>
                    <span>00:00</span>
                    <span>00:00</span>
                </div> */}
            </div>
            <h4 className="text-base font-semibold">{d2?.sunrise.toLocaleString("default", { month: "short", day: "numeric" })}<br />12:00 PM</h4>
            {/* <div className="mt-4 text-sm">
                <p>Dark sky windows (sun and illuminated moon below horizon):</p>
                <ul>
                    {darkSkyWindows?.map((window, index) => (
                        <li key={index}>
                            {`${Math.floor(window.start / 60)}:${(window.start % 60).toString().padStart(2, '0')} - ${Math.floor(window.end / 60)}:${(window.end % 60).toString().padStart(2, '0')}`}
                        </li>
                    ))}
                </ul>
            </div> */}
        </div>
    )
}