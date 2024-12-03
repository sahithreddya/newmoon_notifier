import { createTimeOfInterest } from "astronomy-bundle/time";
import { createMoon } from "astronomy-bundle/moon";
import { createSun } from "astronomy-bundle/sun";

import TimeOfInterest from "astronomy-bundle/time/TimeOfInterest";
import Moon from "astronomy-bundle/moon/Moon";
import Sun from "astronomy-bundle/sun/Sun";

export default class AstroData {
  location: {
    lat: number;
    lon: number;
    elevation: number;
  };
  today: Date;
  todaytoi: TimeOfInterest;
  todaymoon: Moon;
  todaysun: Sun;
  tmrwtoi: TimeOfInterest;
  tmrwmoon: Moon;
  tmrwsun: Sun;
  yesttoi: TimeOfInterest;
  yestmoon: Moon;
  yestsun: Sun;

  constructor(lat: number, lon: number, date: Date) {

    this.location = {
      lat: lat,
      lon: lon,
      elevation: 0,
    };
    this.today = date;
    this.todaytoi = createTimeOfInterest.fromTime(
      this.today.getFullYear(),
      this.today.getMonth() + 1,
      this.today.getDate()
    );
    this.todaymoon = createMoon(this.todaytoi);
    this.todaysun = createSun(this.todaytoi);

    this.tmrwtoi = createTimeOfInterest.fromTime(
      this.today.getFullYear(),
      this.today.getMonth() + 1,
      this.today.getDate() + 1
    );
    this.tmrwmoon = createMoon(this.tmrwtoi);
    this.tmrwsun = createSun(this.tmrwtoi);

    this.yesttoi = createTimeOfInterest.fromTime(
      this.today.getFullYear(),
      this.today.getMonth() + 1,
      this.today.getDate() - 1
    );
    this.yestmoon = createMoon(this.yesttoi);
    this.yestsun = createSun(this.yesttoi);
  }

  getMoonRise = async () => {
    try {
        const toiRise: TimeOfInterest = await this.todaymoon.getRise(this.location);

        const currentDate: Date = this.today;
        currentDate.setHours(0, 0, 0, 0);
        const riseDate: Date = toiRise.getDate();
        riseDate.setHours(0, 0, 0, 0);

        if (toiRise) {
            if (riseDate < currentDate) {
                return await this.tmrwmoon.getRise(this.location);
            } else if (riseDate > currentDate) {
                return await this.yestmoon.getRise(this.location);
            } else {
                return toiRise;
            }
        }
    } catch (e) {
        console.error("Error getting moonrise time on:", this.today.getDate(), e);
        return await this.tmrwmoon.getRise(this.location);
    }
  };

  getMoonSet = async () => {
    try {
      const toiSet: TimeOfInterest = await this.todaymoon.getSet(this.location);

      const currentDate: Date = this.today;
      currentDate.setHours(0, 0, 0, 0);
      const setDate: Date = toiSet.getDate();
      setDate.setHours(0, 0, 0, 0);

      if (toiSet) {
        if (setDate < currentDate) {
          return await this.tmrwmoon.getSet(this.location);
        } else if (setDate > currentDate) {
          return await this.yestmoon.getSet(this.location);
        } else {
          return toiSet;
        }
      }
    } catch (e) {
      console.error("Error getting moonset time for ", this.today.getDate(), e);
      return await this.tmrwmoon.getSet(this.location);
    }
  };

  getUpcomingNewMoon = async () => {
    return (await this.todaymoon.getUpcomingNewMoon());
  };

  getSunRise = async () => {
    try {
      const toiRise: TimeOfInterest = await this.todaysun.getRise(this.location);

      const currentDate: Date = this.today;
      currentDate.setHours(0, 0, 0, 0);
      const riseDate: Date = toiRise.getDate();
      riseDate.setHours(0, 0, 0, 0);

      if (toiRise) {
        if (riseDate < currentDate) {
          return await this.tmrwsun.getRise(this.location);
        } else if (riseDate > currentDate) {
          return await this.yestsun.getRise(this.location);
        } else {
          return toiRise;
        }
      }
    } catch (e) {
      console.error("Error getting sunrise time: ", this.today.getDate(), e);
    }
  };

  getSunSet = async () => {
    try {
      const toiSet: TimeOfInterest = await this.todaysun.getSet(this.location);

      const currentDate: Date = this.today;
      currentDate.setHours(0, 0, 0, 0);
      const setDate: Date = toiSet.getDate();
      setDate.setHours(0, 0, 0, 0);

      if (toiSet) {
        if (setDate < currentDate) {
          return await this.tmrwsun.getSet(this.location);
        } else if (setDate > currentDate) {
          return await this.yestsun.getSet(this.location);
        } else {
          return toiSet;
        }
      }
    } catch (e) {
      console.error("Error getting sunset time: ", this.today.getDate(), e);
    }

  };
}