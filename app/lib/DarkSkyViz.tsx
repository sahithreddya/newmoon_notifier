import React from "react";
import SunriseIcon from "@/public/icons/Sunrise.svg";
import SunsetIcon from "@/public/icons/Sunset.svg";
import MoonriseIcon from "@/public/icons/Moonrise.svg";
import MoonsetIcon from "@/public/icons/Moonset.svg";

import { DayEvent, DayWindow } from "./definitions";
import { calculateEvents, calculateWindows } from "./utils";

export default function DarkSkyVisualizer(d1, d2, key) {
  const [events, eventBeforeNoon]: [DayEvent[], string] = calculateEvents(
    d1,
    d2,
  );
  const darkSkyWindows: DayWindow[] = calculateWindows(events, eventBeforeNoon);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "sunrise":
        return <SunriseIcon className="foreground h-6 w-6 opacity-60" />;
      case "sunset":
        return <SunsetIcon className="foreground h-6 w-6 opacity-60" />;
      case "moonrise":
        return <MoonriseIcon className="foreground h-6 w-6 opacity-60" />;
      case "moonset":
        return <MoonsetIcon className="foreground h-6 w-6 opacity-60" />;
    }
  };

  const TimelineEvent = ({
    event,
    position,
  }: {
    event: DayEvent;
    position: number;
  }) => {
    let actualTime = event.time > 720 ? event.time - 720 : event.time + 720;
    const eventIcon = getEventIcon(event.type);
    let eventPosition;
    if (event.type === "sunrise" || event.type === "sunset") {
      eventPosition = "top-[-24px]";
    } else if (event.type === "moonrise" || event.type === "moonset") {
      eventPosition = "bot-[-24px]";
    }
    return (
      <div
        className={`absolute -translate-x-1/2 transform ${event.type === "sunrise" || event.type === "sunset" ? "top-[-24px]" : "bottom-[-24px]"}`}
        style={{ left: `${position}%` }}
        aria-label={`${event.type} at ${event.time}`}
      >
        <div className="flex flex-col items-center">
          {event.type === "sunrise" || event.type === "sunset" ? (
            getEventIcon(event.type)
          ) : (
            <></>
          )}
          <span className="text-xs font-normal">{`${Math.floor(actualTime / 60)}:${(actualTime % 60).toString().padStart(2, "0")}`}</span>
          {event.type === "sunrise" || event.type === "sunset" ? (
            <></>
          ) : (
            getEventIcon(event.type)
          )}
        </div>
      </div>
    );
  };

  const getWindowColor = (window: DayWindow) => {
    switch (window?.illuminatedSky) {
      case "daylight":
        return "bg-amber-300 opacity-60";
      case "moonlight":
        return "bg-cyan-300 opacity-60";
      case "dark":
        return "bg-gradient-to-r from-blue-950 from-15% via-indigo-950 to-blue-950 to-85%";
    }
  };

  return (
    <div
      className="min-w-2xl flex w-full flex-row gap-2 lg:gap-4 lg:p-2"
      key={key}
    >
      <h4 className="my-auto hidden text-end text-base font-semibold lg:block">
        {d1?.sunset.toLocaleString("default", {
          month: "short",
          day: "numeric",
        })}
      </h4>
      <h4 className="text-center text-sm font-semibold lg:hidden">
        {d1?.sunset.toLocaleString("default", { month: "short" })}
        <br />
        {d1?.sunset.toLocaleString("default", { day: "numeric" })}
      </h4>
      <div className="relative h-12 flex-1 overflow-visible bg-black">
        {darkSkyWindows?.map((window, index) => {
          const startPercent = (window.start / 1440) * 100;
          const widthPercent =
            (Math.abs(window.end - window.start) / 1440) * 100;

          return (
            <div
              key={index}
              className={`absolute h-full ${getWindowColor(window)} `}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
              }}
              aria-label={`Dark sky window from ${Math.floor(window.start / 60)}:${(window.start % 60).toString().padStart(2, "0")} to ${Math.floor(window.end / 60)}:${(window.end % 60).toString().padStart(2, "0")}`}
            />
          );
        })}
        <div className="absolute inset-0 opacity-30" />
        {events
          ?.filter((event) => event.time <= 1440 && event.time >= 0 && event.type !== "startOfDay" && event.type !== "endOfDay")
          .map((event, index) => (
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
        <div className="align-center absolute -bottom-[10%] -top-[10%] left-[50%] flex -translate-x-1/2 transform flex-col items-center">
          <div className="h-full w-0 border-l-2 border-dashed border-l-foreground opacity-60" />
          <span className="text-xs font-semibold text-foreground opacity-60">
            Midnight
          </span>
          <div className="h-full w-0 border-l-2 border-dashed border-l-foreground opacity-60" />
        </div>
      </div>
      <h4 className="my-auto hidden text-base font-semibold lg:block">
        {d2?.sunrise.toLocaleString("default", {
          month: "short",
          day: "numeric",
        })}
      </h4>
      <h4 className="text-center text-sm font-semibold lg:hidden">
        {d2?.sunset.toLocaleString("default", { month: "short" })}
        <br />
        {d2?.sunset.toLocaleString("default", { day: "numeric" })}
      </h4>
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
  );
}
