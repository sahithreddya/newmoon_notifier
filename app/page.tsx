"use client";

import { useEffect, useState } from "react";
import { autocomplete, getPlaceDetails } from "./lib/google";
import { useDebouncedCallback } from 'use-debounce';
import DarkSkyVisualizer from "./lib/DarkSkyViz";
import { getAstroData } from "./lib/data";


export default function Page() {

  const [latitude, setLatitude] = useState(0); // latitude and longitude
  const [longitude, setLongitude] = useState(0);
  const [newmoonDate, setNewmoonDate] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [placetext, setPlaceText] = useState("");
  const [placeTextFocused, setPlaceTextFocused] = useState(false);
  const [placeResultsVisible, setPlaceResultsVisible] = useState(false);
  const [place, setPlace] = useState(null);

  const [astroData, setAstroData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAstroDataRange = async (range) => {
    let data = [];
    let promises = [];
    for (let i = 0; i < (range); i++) {
      promises.push(
        getAstroData(latitude, longitude, new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000))
          .then((val) => val)
      );
    }
    await Promise.all(
      promises
    ).then((val) => {
      setAstroData(val);
    })
  }

  const debouncedFetchPredictions = useDebouncedCallback(
    async (val) => {
      const predictions = await autocomplete(val);
      setPredictions(predictions ?? []);
    },
    800
  );

  const getLatLong = async (id) => {
    try {
      const details = await getPlaceDetails(id);
      console.log("coordinates are ", details);
      if (!details) {
        throw new Error("no details");
      }
      setLatitude(details?.location?.lat);
      setLongitude(details?.location?.lng);
    } catch (error) {
      console.error(error);
    }
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
    if (!place) {
      return;
    }
    setPlaceText(place?.description)
    getLatLong(place?.place_id)
    setPlaceResultsVisible(false)
  }, [place]);

  useEffect(() => {
    if (astroData.length > 0) {
      console.log("astroData populated", astroData);
      setNewmoonDate(astroData[0]?.newmoon?.toDateString() + " " + astroData[0]?.newmoon?.toTimeString());
      setIsLoading(false);
    }
  }, [astroData]);


  return (
    <div className="grid grid-rows-[10px_1fr_10px] items-start gap-0 h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="h-full"/>
      <main className="flex flex-row gap-16 row-start-2 items-start justify-between h-full overflow-y-hidden p-2">
        <div className="flex flex-col gap-8 mt-16">
          <h2 className="text-3xl sm:text-4xl font-bold w-3/5">When is the next New Moon?</h2>
          <div className="flex flex-row gap-4">
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
              onClick={() => getAstroDataRange(8)}
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
        {(isLoading) ? <br/> : <div className="flex gap-8 items-center flex-col w-full overflow-y-scroll h-full py-8">
          {            
            astroData.map((data, i) => (
              (i + 1) < astroData.length &&
              DarkSkyVisualizer(astroData[i], astroData[i + 1], i)
            ))
          }
        </div>}
      </main>
      <div className="h-full"/>
    </div>
  );
}