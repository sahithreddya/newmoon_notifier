import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AstroEvents, DayEvent, DayWindow } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert event times to minutes since midnight
export const convertToMinutes = (
  date: Date | undefined,
  offset: number
): number | undefined => {
  return date ? date.getHours() * 60 + date.getMinutes() + offset : undefined;
};

const findEventBeforeNoon = (events: AstroEvents): string => {
  const eventsBeforeNoon: [string, Date][] = Object.entries(events)
    .filter(([key, date]) => date?.getHours() < 12 && key !== "newmoon")
    .sort((a, b) => a[1].getHours() - b[1].getHours());

  return eventsBeforeNoon.at(-1)[0]; //Returning event type as string
};

export const calculateEvents = (
  t1: AstroEvents,
  t2: AstroEvents
): [DayEvent[], string] => {
  // Coverting event times to total minutes, and adjusting it for the halves of each day
  const t1sunset = convertToMinutes(t1.sunset, -720) ?? 0;
  const t1sunrise = convertToMinutes(t1.sunrise, -720) ?? 0;

  const t2sunset = convertToMinutes(t2.sunset, 720) ?? 0;
  const t2sunrise = convertToMinutes(t2.sunrise, 720) ?? 0;

  const t1moonrise = convertToMinutes(t1?.moonrise, -720) ?? 0;
  const t1moonset = convertToMinutes(t1?.moonset, -720) ?? 0;

  const t2moonrise = convertToMinutes(t2?.moonrise, 720) ?? 0;
  const t2moonset = convertToMinutes(t2?.moonset, 720) ?? 0;

  // Calculating which half the sunrise and sunset belong to
  const sunrise = t1sunrise < 0 ? t2sunrise : t1sunrise;
  const sunset = t1sunset < 0 ? t2sunset : t1sunset;

  // Calculating which half the moonrise and moonset belong to
  const moonrise =
    t1moonrise && t1moonrise < 0 ? t2moonrise : t1moonrise ?? t2moonrise;
  const moonset =
    t1moonset && t1moonset < 0 ? t2moonset : t1moonset ?? t2moonset;

  // Creating events object
  let events: DayEvent[] = [
    { type: "sunrise", time: sunrise ?? 0, order: 0 },
    { type: "sunset", time: sunset ?? 0, order: 0 },
    { type: "moonrise", time: moonrise ?? 0, order: 0 },
    { type: "moonset", time: moonset ?? 0, order: 0 },
  ]
    .filter((e) => e?.time <= 1440)
    .sort((a, b) => a.time - b.time)
    .map((e, i) => {
      return { ...e, order: i + 1 };
    });

  // Add a "0" event to start the day and a "1440" event to end the day
  const eventsWithDayBounds: DayEvent[] = [
    { type: "startOfDay", time: 0, order: 0 },
    ...events,
    { type: "endOfDay", time: 1440, order: events.length + 1 },
  ];

  //Calculating event before noon for t1
  const eventBeforeNoon: string = findEventBeforeNoon(t1);

  return [eventsWithDayBounds as DayEvent[], eventBeforeNoon as string];
};

export const calculateWindows = (
  events: DayEvent[],
  eventBeforeNoon: string
): DayWindow[] => {

  const windows: DayWindow[] = [];

  const sunriseOrder = events.findIndex((e) => e.type === "sunrise");
  const sunsetOrder = events.findIndex((e) => e.type === "sunset");
  const moonriseOrder = events.findIndex((e) => e.type === "moonrise") ?? -1;
  const moonsetOrder = events.findIndex((e) => e.type === "moonset") ?? -1;

  // Determine the state of illuminated of sky based on whether the moon or sun is in the sky
  const calcIlluminatedSky = (
    startEvent: DayEvent,
    endEvent: DayEvent
  ): "daylight" | "moonlight" | "dark" => {

    if (sunsetOrder < sunriseOrder) {
      // sunset is before the sunrise on the 12PM - 12PM scale
      if (startEvent.type === "startOfDay" || endEvent.type === "endOfDay") {
        return "daylight";
      }
      if (startEvent.type === "sunrise" || endEvent.type === "sunset") {
        return "daylight";
      }
      if (startEvent.type === "moonrise") {
        if (moonriseOrder > sunsetOrder && moonriseOrder < sunriseOrder) {
          return "moonlight";
        } else {
          return "daylight";
        }
      }
      if (endEvent.type === "moonset") {
        if (moonsetOrder > sunsetOrder && moonsetOrder < sunriseOrder) {
          return "moonlight";
        } else {
          return "daylight";
        }
      }
      if (startEvent.type === "sunset" && endEvent.type === "sunrise" && (moonriseOrder < sunsetOrder) && (moonsetOrder > sunriseOrder)) {
        return "moonlight";
      }
    } else if (sunriseOrder < sunsetOrder) {
      // sunset is after the sunrise on the 12PM - 12PM scale
      if (startEvent.type === "startOfDay" && eventBeforeNoon === "moonrise") {
        return "moonlight";
      }
      if (startEvent.type === "sunrise" || endEvent.type === "sunset") {
        return "daylight";
      }
      if (startEvent.type === "moonrise") {
        if (moonriseOrder > sunsetOrder || moonriseOrder < sunriseOrder) {
          return "moonlight";
        } else {
          return "daylight";
        }
      }
      if (endEvent.type === "moonset") {
        if (moonsetOrder > sunsetOrder || moonsetOrder < sunriseOrder) {
          return "moonlight";
        } else {
          return "daylight";
        }
      }
      if(endEvent.type === "endOfDay" && moonriseOrder > moonsetOrder) {
        return "moonlight";
      }
    }
    return "dark"; // Sky is dark when none of the conditions satisfy
  };

  // Create windows based on the sorted events
  for (let i = 0; i < events.length - 1; i++) {
    const currentEvent = events[i];
    const nextEvent = events[i + 1];

    const start = currentEvent.time;
    const end = nextEvent.time;

    windows.push({
      start: start === 1440 ? 1440 : start % 1440, // Normalize to 0-1440 scale 
      end: end === 1440 ? 1440 : end % 1440, // Normalize to 0-1440 scale
      illuminatedSky: calcIlluminatedSky(currentEvent, nextEvent),
    });
  }

  return windows;
};
