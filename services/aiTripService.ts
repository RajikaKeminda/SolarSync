import { GoogleGenerativeAI } from '@google/generative-ai';
import { Location } from '../types';

// Initialize Gemini AI
const GEMINI_API_KEY = 'AIzaSyD8_kKyUtm8xdEvfsVzWL33im80OTn5Yf4';
const GOOGLE_GEOCODING_API_KEY = 'AIzaSyDbwrDmVctiSZCBboT2-5QZt5QrTEw5iFo'; // Same API key can be used for both

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface ExtractedLocation {
  name: string;
  type: 'start' | 'destination' | 'stop';
  order?: number;
}

export interface ExtractedLocations {
  start: string | null;
  destination: string | null;
  stops: string[];
}

export interface GeocodedLocation extends Location {
  name: string;
  formatted_address: string;
}

/**
 * Extract location information from natural language trip description using Gemini AI
 */
export async function extractLocationsFromDescription(
  description: string
): Promise<ExtractedLocations> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a helpful AI assistant that extracts location information from trip descriptions.

Given the following trip description, extract:
1. The starting location (start)
2. The destination location (destination)
3. Any intermediate stops (stops) in order

Trip Description: "${description}"

Please respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks, no additional text):
{
  "start": "location name or null",
  "destination": "location name or null",
  "stops": ["stop1", "stop2", ...]
}

Rules:
- Use city names, not country names unless the city is not mentioned
- If a location is not mentioned, use null for start/destination or empty array for stops
- Extract stops in the order they are mentioned
- Be specific with location names (e.g., "Colombo, Sri Lanka" not just "Sri Lanka")
- Return ONLY the JSON object, nothing else`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Remove markdown code blocks if present
    let jsonText = text;
    if (text.startsWith('```json')) {
      jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      jsonText = text.replace(/```\n?/g, '');
    }

    const extracted: ExtractedLocations = JSON.parse(jsonText);

    // Validate the response
    if (!extracted.start && !extracted.destination) {
      throw new Error('Could not extract any locations from the description');
    }

    return extracted;
  } catch (error) {
    console.error('Error extracting locations:', error);
    throw new Error('Failed to extract locations from description. Please try rephrasing your trip plan.');
  }
}

/**
 * Convert a location name to coordinates using Google Geocoding API
 */
export async function geocodeLocation(
  locationName: string
): Promise<GeocodedLocation> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      locationName
    )}&key=${GOOGLE_GEOCODING_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Could not find location: ${locationName}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      name: locationName,
      latitude: location.lat,
      longitude: location.lng,
      address: result.formatted_address,
      formatted_address: result.formatted_address,
    };
  } catch (error) {
    console.error(`Error geocoding location "${locationName}":`, error);
    throw new Error(`Failed to find coordinates for: ${locationName}`);
  }
}

/**
 * Geocode multiple locations
 */
export async function geocodeMultipleLocations(
  locationNames: string[]
): Promise<GeocodedLocation[]> {
  const results: GeocodedLocation[] = [];

  for (const name of locationNames) {
    try {
      const geocoded = await geocodeLocation(name);
      results.push(geocoded);
    } catch (error) {
      console.error(`Failed to geocode "${name}":`, error);
      // Continue with other locations even if one fails
    }
  }

  return results;
}

/**
 * Get the midpoint between two locations
 */
export function getMidpoint(loc1: Location, loc2: Location): Location {
  return {
    latitude: (loc1.latitude + loc2.latitude) / 2,
    longitude: (loc1.longitude + loc2.longitude) / 2,
  };
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get all route segments from a list of locations
 */
export function getRouteSegments(
  locations: GeocodedLocation[]
): { from: GeocodedLocation; to: GeocodedLocation; distance: number }[] {
  const segments: {
    from: GeocodedLocation;
    to: GeocodedLocation;
    distance: number;
  }[] = [];

  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];
    const distance = calculateDistance(from, to);
    segments.push({ from, to, distance });
  }

  return segments;
}

