"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/app/components/ui/scroll-area";
import { Toaster } from "@/app/components/ui/toaster";
import { DatePickerWithRange } from "./components/ui/date-picker";
import { useToast } from "./hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";

import DarkSkyVisualizer from "./lib/DarkSkyViz";

import { addDays, differenceInDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

import { useEffect, useState } from "react";

import { autocomplete, getPlaceDetails } from "./lib/google";
import { useDebouncedCallback } from "use-debounce";
import { getAstroData, getMoonData, sendFeedback } from "./lib/data";
import { Loader } from "./components/ui/loader";

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
  const [isNewMoonLoading, setIsNewMoonLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [email, setEmail] = useState(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: addDays(new Date(new Date().setHours(0, 0, 0, 0)), 7),
  });

  useEffect(() => {
    // console.log("place changed to ", place);
    if (!place) {
      return;
    }
    setPlaceText(place?.description);
    getLatLong(place?.place_id); // Getting lat and long values using place id
    setPlaceResultsVisible(false);
  }, [place]);

  useEffect(() => {
    if (!latitude || !longitude) {
      return;
    }
    setIsNewMoonLoading(true);
    getAstroDataRange();
    getMoonData(latitude, longitude).then((timestamp) => {
      // getting new moon info using moon-phase api
      const newmoonDate = new Date(timestamp);
      setNewmoonDate(newmoonDate);
      setIsNewMoonLoading(false);
    });
  }, [latitude, longitude]);

  useEffect(() => {
    if (astroData.length > 0) {
      setIsLoading(false);
    }
  }, [astroData]);

  const { toast } = useToast();

  const getAstroDataRange = async () => {
    console.log("[LOG]: User's current time is: ", new Date());
    if (!latitude || !longitude) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please select a location.",
      });
      return;
    }
    if (!date || !date.from || !date.to) {
      toast({
        variant: "destructive",
        title: "Date Required",
        description: "Please select a date range.",
      });
      return;
    }
    setIsLoading(true);
    let promises = [];
    for (let i = 0; i <= differenceInDays(date?.to, date?.from); i++) {
      promises.push(
        getAstroData(latitude, longitude, addDays(date?.from, i)).then(
          (val) => val,
        ),
      );
    }
    try {
      await Promise.all(promises).then((val) => {
        setAstroData(val);
      });
    } catch (error) {
      console.error("error getting astro data range: ", error);
    }
  };

  const debouncedFetchPredictions = useDebouncedCallback(async (val) => {
    const predictions = await autocomplete(val);
    setPredictions(predictions ?? []);
  }, 800);

  const getLatLong = async (id) => {
    try {
      const details = await getPlaceDetails(id);
      // console.log("coordinates are ", details);
      if (!details) {
        throw new Error("no details");
      }
      setLatitude(details?.location?.lat);
      setLongitude(details?.location?.lng);
    } catch (error) {
      console.error(error);
    }
  };

  const OnPlaceTextChange = (val) => {
    if (placeTextFocused) {
      setPlaceText(val);
      debouncedFetchPredictions(val);
      setPlaceResultsVisible(true);
    }
  };

  const submitFeedback = async (e, { feedback, email }) => {
    e.preventDefault();
    if (!feedback || /^\s*$/.test(feedback)) {
      toast({
        variant: "destructive",
        title: "Missing Feedback",
        description: "Please provide feedback before submitting.",
      });
      return;
    }
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Missing (or) Invalid Email",
        description: "Please provide a valid email before submitting.",
      });
      return;
    }

    const { data, error } = await sendFeedback(feedback, email);

    if (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Feedback sumission failed",
        description:
          "An error occurred while submitting your feedback: " + error,
      });
    } else {
      setFeedback("");
      setEmail("");
      setOpenDialog(false);
      toast({
        variant: "constructive",
        title: "Feedback submitted",
        description: "Thanks for your feedback.",
      });
    }
  };

  const ColorLegend: React.FC = () => {
    const legendItems = [
      { color: "bg-amber-300 opacity-60", label: "Sunlight" },
      { color: "bg-cyan-300 opacity-60", label: "Moonlight" },
      {
        color:
          "bg-gradient-to-r from-blue-950 from-15% via-indigo-950 to-blue-950 to-85%",
        label: "No light/Dark Sky",
      },
    ];

    return (
      <div className="flex flex-row flex-wrap justify-center gap-4 rounded-lg p-2 shadow-md lg:p-4">
        {/* <h2 className="mb-2 text-lg font-semibold">Legend</h2> */}
        {legendItems.map((item, index) => (
          <div key={"legend_" + index} className="flex items-center gap-1">
            <div
              className={`h-4 w-4 lg:h-6 lg:w-6 ${item.color}`}
              aria-hidden="true"
            ></div>
            <span className="text-nowrap text-sm lg:text-base">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dark grid h-screen grid-rows-[1fr] items-start gap-0 p-2 font-[family-name:var(--font-geist-sans)] lg:p-4">
      {/* <div className="h-full" /> */}
      <main className="grid h-full grid-rows-[auto_1fr_auto] items-start gap-4 overflow-y-hidden p-2 lg:grid-cols-[1fr_auto_2fr] lg:grid-rows-none lg:gap-16">
        <div className="flex h-full w-full flex-col gap-8">
          <h2 className="text-2xl font-bold">
            Find the perfect night <br /> for stargazing.
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              className=""
              placeholder="Start typing a location..."
              onFocus={() => setPlaceTextFocused(true)}
              onBlur={() => setPlaceTextFocused(false)}
              value={placetext || ""}
              onChange={(e) => OnPlaceTextChange(e.target.value)}
            />
            {/* <Button
              className=""
              onClick={() => getAstroDataRange()}
              rel="noopener noreferrer"
              variant="default"
            >
              Check
            </Button> */}
            {placeResultsVisible && (
              <div className="relative w-full">
                <div className="absolute z-10 flex w-full flex-col bg-background/80 backdrop-blur-xl">
                  {predictions.map((prediction) => (
                    <div
                      className="border border-solid border-[#ccc] p-2 text-white first:rounded-t last:rounded-b hover:cursor-pointer hover:bg-white hover:text-black not-last:border-b-0"
                      key={prediction.place_id}
                      onClick={() => setPlace(prediction)}
                    >
                      {prediction.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 lg:justify-start">
              {DatePickerWithRange({ date, setDate })}
              <Button
                className=""
                onClick={() => getAstroDataRange()}
                rel="noopener noreferrer"
                variant="default"
              >
                Find
              </Button>
            </div>
          </div>
          <div className="hidden flex-1 flex-col lg:flex">
            <div className="hidden flex-1 content-center lg:block">
              {place && (
                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-muted-foreground">
                    Upcoming New Moon
                  </p>
                  <div className={`${isNewMoonLoading ? "visible" : "hidden"}`}>
                    <Loader size="sm" />
                  </div>
                  <div
                    className={`${!isNewMoonLoading ? "visible" : "hidden"}`}
                  >
                    <p className="text-3xl font-semibold">
                      {newmoonDate && format(newmoonDate, "EEE, MMM do")}
                    </p>
                    <p>{newmoonDate && format(newmoonDate, "H:mm O")}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden flex-1 flex-wrap content-end lg:flex">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button
                    className=""
                    onClick={() => {}}
                    rel="noopener noreferrer"
                    variant="secondary"
                  >
                    Help improve this app
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
        <Separator orientation="vertical" className="hidden h-full lg:block" />
        {/* <Separator orientation="horizontal" className="w-full lg:hidden" /> */}
        {isLoading ? (
          place ? (
            <div className="flex h-full flex-row items-center justify-center gap-4">
              <Loader size="md" />
              <p>Loading...</p>
            </div>
          ) : (
            <br />
          )
        ) : (
          <div className="flex h-full flex-col gap-2 overflow-y-hidden">
            {/* <p className="hidden lg:block text-2xl font-bold">Dark sky windows </p> */}
            <div className="relative h-6 max-w-screen-lg flex-1 overflow-hidden rounded-md border border-[hsl(var(--border))]">
              <ColorLegend />
              <ScrollArea type="auto" className="-z-0 h-full">
                <div className="relative flex w-full flex-col items-start gap-8 py-8 pl-2 pr-4 lg:pl-4 lg:pr-6">
                  {astroData.map(
                    (data, i) =>
                      i + 1 < astroData.length && (
                        <div
                          className="flex w-full flex-col gap-8"
                          key={"viz_" + i}
                        >
                          {DarkSkyVisualizer(astroData[i], astroData[i + 1], i)}
                          <Separator
                            orientation="horizontal"
                            className="w-full"
                            key={"viz_separator_" + i}
                          />
                        </div>
                      ),
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4 lg:hidden">
          <div className="lg:hidden">
            {place && (
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-muted-foreground">
                  Upcoming New Moon
                </p>
                <div
                  className={`${isNewMoonLoading ? "visible" : "hidden"} flex flex-row items-center`}
                >
                  <Loader size="sm" />
                  <div className="opacity-0">
                    <p className="text-2xl font-semibold">
                      {format(new Date(), "EEE, MMM do")}
                    </p>
                    <p>{format(new Date(), "H:mm O")}</p>
                  </div>
                </div>
                <div className={`${!isNewMoonLoading ? "visible" : "hidden"}`}>
                  <p className="text-2xl font-semibold">
                    {newmoonDate && format(newmoonDate, "EEE, MMM do")}
                  </p>
                  <p>{newmoonDate && format(newmoonDate, "H:mm O")}</p>
                </div>
              </div>
            )}
          </div>
          <Separator orientation="horizontal" className="w-full lg:hidden" />
          <div className="flex-1 content-end self-center lg:hidden">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button
                  className=""
                  onClick={() => {}}
                  rel="noopener noreferrer"
                  variant="secondary"
                >
                  Help improve this app
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[80%] rounded-lg p-4 lg:max-w-[30%] lg:p-6">
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                  <DialogDescription className="text-base">
                    <i>Darksites.co</i> is still in development and we would
                    love to get your feedback.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="">
                    <Textarea
                      className="h-[10rem] text-base"
                      placeholder="Type your message here."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-left text-base font-semibold">Email</p>
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
      </main>
      {/* <div className="h-full" /> */}
      <div className="text-center text-sm lg:text-start lg:text-base">
        <span className="text-accent-foreground/60">
          *All times and dates are in your device&apos;s local timezone.*
        </span>
      </div>
      <Toaster />
    </div>
  );
}
