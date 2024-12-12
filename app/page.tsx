"use client";

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { Toaster } from "@/app/components/ui/toaster";
import { DatePickerWithRange } from "./components/ui/date-picker";
import { useToast } from "./hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";

import DarkSkyVisualizer from "./lib/DarkSkyViz";

import { addDays, differenceInDays } from "date-fns"
import { DateRange } from "react-day-picker"

import { useEffect, useState } from "react";

import { autocomplete, getPlaceDetails } from "./lib/google";
import { useDebouncedCallback } from 'use-debounce';
import { getAstroData, getMoonData, sendFeedback } from "./lib/data";


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

  const [openDialog, setOpenDialog] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [email, setEmail] = useState(null);

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
    getLatLong(place?.place_id) // Getting lat and long values using place id
    getMoonData(latitude, longitude).then((timestamp) => { // getting new moon info using moon-phase api
      const newmoonDate = new Date(timestamp)
      setNewmoonDate(newmoonDate.toDateString() + " " + newmoonDate.toTimeString()) 
    })
    setPlaceResultsVisible(false)
  }, [place]);

  useEffect(() => {
    if (astroData.length > 0) {
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

  const submitFeedback = async (e, { feedback, email }) => {
    e.preventDefault()
    if (!feedback || (/^\s*$/.test(feedback))) {
      toast({
        variant: "destructive",
        title: "Missing Feedback",
        description: "Please provide feedback before submitting.",
      })
      return;
    }
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Missing (or) Invalid Email",
        description: "Please provide a valid email before submitting.",
      })
      return;
    }

    const { data, error } = await sendFeedback(feedback, email);

    if (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Feedback sumission failed",
        description: "An error occurred while submitting your feedback: " + error,
      })
    }
    else {
      setFeedback('')
      setEmail('')
      setOpenDialog(false)
      toast({
        variant: "constructive",
        title: "Feedback submitted",
        description: "Thanks for your feedback.",
      })
    }
  }


  return (
    <div className="grid grid-rows-[10px_1fr_10px] items-start gap-0 h-screen p-8 font-[family-name:var(--font-geist-sans)] dark">
      <div className="h-full"/>
      <main className="grid grid-cols-[1fr_auto_2fr] gap-16 row-start-2 items-start justify-between h-full overflow-y-hidden p-2">
        <div className="flex flex-col gap-8 h-full">
          <h2 className="text-3xl sm:text-4xl font-bold">When is the next <br/> New Moon?</h2>
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
          {!isLoading && <p className={`${newmoonDate ? "visible" : "hidden"} text-base`}>The next new moon is at <b>{newmoonDate}</b></p>}
          <div className="flex-1 content-end">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button
                  className=""
                  onClick={() => { }}
                  rel="noopener noreferrer"
                  variant="secondary"
                >
                  Help improve this app
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[50%] md:max-w-[30%]">
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                  <DialogDescription className="text-base">
                    <i>Darksites.co</i> is still in development and we would love to get your feedback.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="">
                    <Textarea className="h-[10rem] text-base" placeholder="Type your message here." value={feedback} onChange={(e) => setFeedback(e.target.value)}/>
                  </div>
                  <div className="flex flex-col gap-2 items-start">
                    <p className="text-left text-base font-semibold">
                      Email
                    </p>
                    <Input
                      id="username"
                      placeholder="youremail@example.com"
                      className=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="">
                  <Button 
                    type="submit"
                    variant="secondary"
                    onClick={(e) => submitFeedback(e, { feedback, email })}
                    >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Separator orientation="vertical" className="h-full" />
        {(isLoading) ? <br /> : <div className=" flex flex-col h-full overflow-y-hidden">
          <p className="text-xl sm:text-2xl font-bold">Dark sky windows </p>
          {
            DatePickerWithRange({ date, setDate })
          }
          <div className="max-w-screen-lg relative h-6 flex-1 overflow-hidden border rounded-md border-[hsl(var(--border))]">
            <ScrollArea type="auto" className="h-full -z-0">
              <div className="relative flex gap-8 items-start flex-col w-full py-8 pl-4 pr-6">
                {
                  astroData.map((data, i) => (
                    (i + 1) < astroData.length &&
                    <div className="flex flex-col gap-8 w-full" key={i}>
                      {DarkSkyVisualizer(astroData[i], astroData[i + 1], i)}
                      <Separator orientation="horizontal" className="w-full" key={i} />
                    </div>
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