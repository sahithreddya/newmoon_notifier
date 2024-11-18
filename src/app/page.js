"use client";

import { useEffect, useState } from "react";
import { autocomplete, getPlaceDetails } from "./lib/google";
import { PlaceAutocompleteResult } from "@googlemaps/google-maps-services-js";
import { useDebouncedCallback } from 'use-debounce';


export async function getMoonData(lat, long) {
  let data = await fetch(`https://moon-phase.p.rapidapi.com/advanced?lat=${Number(lat)}&lon=${Number(long)}`, {
    "method": "GET",
    "headers": {
      "x-rapidapi-host": "moon-phase.p.rapidapi.com",
      "x-rapidapi-key": "XXXXX" // API Key
    }
  })
  if (!data.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  let moondata = await data.json()
  // console.log("moondata is ", moondata);

  const newmoonDate = new Date(moondata.moon_phases?.new_moon?.next?.timestamp * 1000)
  return [newmoonDate.toDateString() + " " + newmoonDate.toTimeString()];
  // return "Thu Oct 31 2024"
}

export default function Home() {

  const [latitude, setLatitude] = useState(0); // latitude and longitude
  const [longitude, setLongitude] = useState(0);
  const [newmoonDate, setNewmoonDate] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [placetext, setPlaceText] = useState("");
  const [placeTextFocused, setPlaceTextFocused] = useState(false);
  const [placeResultsVisible, setPlaceResultsVisible] = useState(false);
  const [place, setPlace] = useState(null);

  const debouncedFetchPredictions = useDebouncedCallback(
    async (val) => {
      const predictions = await autocomplete(val);
      setPredictions(predictions ?? []);
    },
    800
  );

  const getLatLong = async (id) => {
    const details = await getPlaceDetails(id);
    console.log("coordinates are ", details);
    setLatitude(details?.location?.lat);
    setLongitude(details?.location?.lng);
  }

  const OnPlaceTextChange = (val) => {
    if (placeTextFocused) {
      setPlaceText(val)
      debouncedFetchPredictions(val);
      setPlaceResultsVisible(true)
    }
  };

  useEffect(() => {
    console.log("place changed to ", place);
    setPlaceText(place?.description)
    getLatLong(place?.place_id)
    setPlaceResultsVisible(false)
  }, [place]);


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-8">
          <h2 className="text-5xl sm:text-6xl font-bold w-3/5">When is the next New Moon?</h2>
          <div className="flex flex-row gap-4">
            <input
              type="number"
              className="hidden bg-transparent border border-solid border-[#ccc] rounded p-2 w-40"
              placeholder="Latitude"
              onChange={(e) => setLatitude(e.target.value)}
            />
            <input
              type="number"
              className="hidden bg-transparent border border-solid border-[#ccc] rounded p-2 w-40"
              placeholder="Longitude"
              onChange={(e) => setLongitude(e.target.value)}
            />
            <input
              type="text"
              className="bg-transparent border border-solid border-[#ccc] rounded p-2 w-80"
              placeholder="Start typing a location..."
              onFocus={() => setPlaceTextFocused(true)}
              onBlur={() => setPlaceTextFocused(false)}
              value={placetext || ""}
              onChange={(e) => OnPlaceTextChange(e.target.value)}
            />
            <button
              className="w-40 rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              onClick={() => setNewmoonDate(getMoonData(latitude, longitude))}
              // onClick={() => setNewmoonDate(getMoonData(33.7445, -118.3870))}
              target="_blank"
              rel="noopener noreferrer"
            >
              Check
            </button>
          </div>
          <div className="flex flex-col">
            {
              placeResultsVisible && predictions.map((prediction) => (
                <div className="text-white border not-last:border-b-0 border-solid border-[#ccc] first:rounded-t last:rounded-b p-2 hover:bg-white hover:text-black hover:cursor-pointer"
                  key={prediction.place_id}
                  onClick={() => setPlace(prediction)}>
                  {prediction.description}
                </div>
              ))
            }
          </div>
          <p className={`${newmoonDate ? "visible" : "hidden"}`}>The next new moon is at <b>{newmoonDate}</b></p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
        </div>
      </main>
    </div>
  );
}