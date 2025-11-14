/**
 * VedicAstro API Client
 *
 * Provides access to Vedic astrology calculations and predictions.
 * Includes birth charts, daily horoscopes, panchang, and more.
 *
 * API Documentation: https://www.vedicastroapi.com
 */

import axios from "axios";

const VEDIC_ASTRO_BASE = "https://json.astrologyapi.com/v1";

export interface BirthDetails {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone: number;
}

export interface HoroscopeResult {
  prediction: string;
  bot_response: string;
}

export interface BirthChartResult {
  planets: Planet[];
  houses: House[];
  ascendant: string;
}

export interface Planet {
  name: string;
  fullDegree: number;
  normDegree: number;
  sign: string;
  house: number;
  isRetro: string;
}

export interface House {
  house: number;
  sign: string;
  signLord: string;
  degree: number;
}

export interface PanchangResult {
  day: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  auspicious_period?: {
    abhijit_muhurta: string;
    brahma_muhurta: string;
  };
}

/**
 * Get authentication headers for VedicAstro API
 */
function getAuthHeaders(): Record<string, string> {
  const userId = process.env.VEDIC_ASTRO_USER_ID;
  const apiKey = process.env.VEDIC_ASTRO_API_KEY;

  if (!userId || !apiKey) {
    throw new Error("VEDIC_ASTRO credentials not configured");
  }

  return {
    Authorization: `Basic ${Buffer.from(`${userId}:${apiKey}`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get daily horoscope by sun sign
 */
export async function getDailyHoroscope(
  sign: string,
  date?: Date
): Promise<HoroscopeResult> {
  try {
    const targetDate = date || new Date();

    const response = await axios.post(
      `${VEDIC_ASTRO_BASE}/sun_sign_prediction/daily/${sign.toLowerCase()}`,
      {
        day: targetDate.getDate(),
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
      },
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[VedicAstro API Error]", error.response?.data || error.message);
    // Return fallback for demo purposes
    return {
      prediction: "Focus on self-care and mindfulness today.",
      bot_response: "Today is a good day for introspection and personal growth.",
    };
  }
}

/**
 * Get birth chart (Kundli)
 */
export async function getBirthChart(
  birthDetails: BirthDetails
): Promise<BirthChartResult> {
  try {
    const response = await axios.post(
      `${VEDIC_ASTRO_BASE}/birth_details`,
      birthDetails,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[VedicAstro API Error]", error.response?.data || error.message);
    throw new Error(`VedicAstro API error: ${error.message}`);
  }
}

/**
 * Get Panchang (Vedic calendar) for a date
 */
export async function getPanchang(
  date: Date,
  latitude: number,
  longitude: number,
  timezone: number = 5.5
): Promise<PanchangResult> {
  try {
    const response = await axios.post(
      `${VEDIC_ASTRO_BASE}/advanced_panchang`,
      {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        latitude,
        longitude,
        timezone,
      },
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[VedicAstro API Error]", error.response?.data || error.message);
    // Return fallback
    return {
      day: date.toLocaleDateString(),
      sunrise: "06:00 AM",
      sunset: "06:00 PM",
      moonrise: "08:00 PM",
      moonset: "08:00 AM",
      tithi: "Shukla Paksha",
      nakshatra: "Rohini",
      yoga: "Shiva",
      karana: "Bava",
      auspicious_period: {
        abhijit_muhurta: "12:00 PM - 12:48 PM",
        brahma_muhurta: "04:30 AM - 05:18 AM",
      },
    };
  }
}

/**
 * Get planet positions for a date
 */
export async function getPlanetPositions(
  birthDetails: BirthDetails
): Promise<Planet[]> {
  try {
    const response = await axios.post(
      `${VEDIC_ASTRO_BASE}/planets`,
      birthDetails,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[VedicAstro API Error]", error.response?.data || error.message);
    throw new Error(`VedicAstro API error: ${error.message}`);
  }
}

/**
 * Get auspicious timing recommendations
 */
export async function getAuspiciousTimes(
  date: Date,
  latitude: number,
  longitude: number
): Promise<{
  best_time_for_meditation: string;
  best_time_for_exercise: string;
  avoid_periods: string[];
}> {
  try {
    const panchang = await getPanchang(date, latitude, longitude);

    // Simple logic based on panchang
    return {
      best_time_for_meditation: panchang.auspicious_period?.brahma_muhurta || "05:00 AM - 06:00 AM",
      best_time_for_exercise: "06:00 AM - 08:00 AM",
      avoid_periods: ["12:00 PM - 01:30 PM"], // Rahu Kaal (approximate)
    };
  } catch (error: any) {
    console.error("[Auspicious Times Error]", error);
    return {
      best_time_for_meditation: "05:00 AM - 06:00 AM",
      best_time_for_exercise: "06:00 AM - 08:00 AM",
      avoid_periods: [],
    };
  }
}

/**
 * Determine sun sign from birth date
 */
export function getSunSign(month: number, day: number): string {
  const signs = [
    { name: "Capricorn", start: [12, 22], end: [1, 19] },
    { name: "Aquarius", start: [1, 20], end: [2, 18] },
    { name: "Pisces", start: [2, 19], end: [3, 20] },
    { name: "Aries", start: [3, 21], end: [4, 19] },
    { name: "Taurus", start: [4, 20], end: [5, 20] },
    { name: "Gemini", start: [5, 21], end: [6, 20] },
    { name: "Cancer", start: [6, 21], end: [7, 22] },
    { name: "Leo", start: [7, 23], end: [8, 22] },
    { name: "Virgo", start: [8, 23], end: [9, 22] },
    { name: "Libra", start: [9, 23], end: [10, 22] },
    { name: "Scorpio", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius", start: [11, 22], end: [12, 21] },
  ];

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name;
    }
  }

  return "Unknown";
}
