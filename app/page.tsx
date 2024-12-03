"use client";

import { useEffect, useState } from "react";
import { autocomplete, getPlaceDetails } from "./lib/google";
import { useDebouncedCallback } from 'use-debounce';
import DarkSkyVisualizer from "./lib/DarkSkyViz";
import { getAstroData, getMoonData } from "./lib/data";
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { addDays, differenceInDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { Toaster } from "@/app/components/ui/toaster";
import { DatePickerWithRange } from "./components/ui/date-picker";
import { useToast } from "./hooks/use-toast";



export default function Page() {

  const [latitude, setLatitude] = useState<number>(null); // latitude and longitude
  const [longitude, setLongitude] = useState<number>(null);
  const [newmoonDate, setNewmoonDate] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [placetext, setPlaceText] = useState("");
  const [placeTextFocused, setPlaceTextFocused] = useState(false);
  const [placeResultsVisible, setPlaceResultsVisible] = useState(false);
  const [place, setPlace] = useState(null);

  const [astroData, setAstroData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: addDays(new Date(new Date().setHours(0, 0, 0, 0)), 7),
  })

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
      // setNewmoonDate(astroData[0]?.newmoon?.toDateString() + " " + astroData[0]?.newmoon?.toTimeString()); // using astronomy-bundle library
      getMoonData(latitude, longitude).then((val) => {
        setNewmoonDate(val) // using moon-phase api
      })
      setIsLoading(false);
    }
  }, [astroData]);

  
  const { toast } = useToast()

  const getAstroDataRange = async () => {
    if (!latitude || !longitude) {
      toast({
            variant: "destructive",
            title: "Location Required",
            description: "Please select a location.",
          })
        return;
    }
    let promises = [];
    for (let i = 0; i <= (differenceInDays(date?.to, date?.from)); i++) {
      promises.push(
        getAstroData(latitude, longitude, addDays(date?.from, i))
          .then((val) => val)
      );
    }
    try {
      await Promise.all(
        promises
      ).then((val) => {
        setAstroData(val);
      })
    }
    catch (error) {
      console.error("error getting astro data range: ", error);
    }
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


  return (
    <div className="grid grid-rows-[10px_1fr_10px] items-start gap-0 h-screen p-8 font-[family-name:var(--font-geist-sans)] dark">
      <div className="h-full"/>
      <main className="grid grid-cols-[1fr_auto_2fr] gap-16 row-start-2 items-start justify-between h-full overflow-y-hidden p-2">
        <div className="flex flex-col gap-8">
          <h2 className="text-3xl sm:text-4xl font-bold w-3/5">When is the next New Moon?</h2>
          <div className="flex flex-row gap-4">
            <Input
              type="text"
              className=""
              placeholder="Start typing a location..."
              onFocus={() => setPlaceTextFocused(true)}
              onBlur={() => setPlaceTextFocused(false)}
              value={placetext || ""}
              onChange={(e) => OnPlaceTextChange(e.target.value)}
            />
            <Button
              className=""
              onClick={() => getAstroDataRange()}
              rel="noopener noreferrer"
              variant="default"
            >
              Check
            </Button>
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
          <p className={`${newmoonDate ? "visible" : "hidden"} text-base`}>The next new moon is at <b>{newmoonDate}</b></p>
        </div>
        <Separator orientation="vertical" className="h-full" />
        {(isLoading) ? <br /> : <div className=" flex flex-col h-full overflow-y-hidden">
          <p className="text-xl sm:text-2xl font-bold">Dark sky windows </p>
          {
            DatePickerWithRange({ date, setDate })
          }
          <div className="relative h-6 flex-1 overflow-hidden border rounded-md border-[hsl(var(--border))]">
            <ScrollArea type="auto" className="h-full -z-0">
              <div className="relative flex gap-8 items-start flex-col w-full px-4 py-8">
                {
                  astroData.map((data, i) => (
                    (i + 1) < astroData.length &&
                    DarkSkyVisualizer(astroData[i], astroData[i + 1], i)
                  ))
                }
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
        }
      </main>
      <div className="h-full"/>
      <Toaster />
    </div>
  );
}