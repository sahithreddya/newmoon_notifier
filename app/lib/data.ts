"use server";

import supabase from "../utils/supabase";
import AstroData from "./AstroData";

export async function getMoonData(lat, long) {
  let data = await fetch(
    `https://moon-phase.p.rapidapi.com/advanced?lat=${Number(lat)}&lon=${Number(long)}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": "moon-phase.p.rapidapi.com",
        "x-rapidapi-key": process.env.MOON_API_KEY!,
      },
    },
  );
  try {
    let moondata = await data.json();
    // console.log("moon data is ", moondata);
    const newmoonDateTime =
      moondata?.moon?.detailed?.upcoming_phases?.new_moon?.next?.timestamp *
      1000;
    return newmoonDateTime;
  } catch (error) {
    console.error(error);
  }
}

export async function getAstroData(lat: number, lon: number, date: Date) {
  const astroObj: AstroData = new AstroData(lat, lon, date);

  let [sunrise, sunset, moonrise, moonset, newmoon] = await Promise.all([
    astroObj.getSunRise(),
    astroObj.getSunSet(),
    astroObj.getMoonRise(),
    astroObj.getMoonSet(),
    astroObj.getUpcomingNewMoon(),
  ]);

  return {
    sunrise: sunrise?.getDate() || null,
    sunset: sunset?.getDate() || null,
    moonrise: moonrise?.getDate() || null,
    moonset: moonset?.getDate() || null,
    newmoon: newmoon?.getDate() || null,
  };
}

export async function sendFeedback(feedback: string, email: string) {
  const { data, error } = await supabase
    .from("Feedback")
    .insert({ value: feedback, email: email });

  return { data, error };
}
