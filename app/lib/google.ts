"use server";

import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client();
export const autocomplete = async (input: string) => {
  try {
    const response = await client.placeAutocomplete({
      params: {
        input,
        key: process.env.GOOGLE_API_KEY!,
      },
    });

    // console.log("place res is ", response?.data);

    return response?.data?.predictions;
  } catch (error) {
    console.error(error);
  }
};

export const getPlaceDetails = async (input: string) => {
  try {
    const response = await client.placeDetails({
      params: {
        place_id: input,
        key: process.env.GOOGLE_API_KEY!,
      },
    });

    // console.log("loc res is ", response?.data);

    return response?.data?.result?.geometry;
  } catch (error) {
    console.error(error);
  }
};
