// constants.ts

// ----------------------
// Design Styles by Space
// ----------------------

// Interior design styles
export const INTERIOR_STYLES = [
  "Modern",
  "Minimalist",
  "Scandinavian",
  "Bohemian (Boho)",
  "Industrial",
  "Mid-Century Modern",
  "Contemporary",
  "Japandi",
  "Rustic",
  "Coastal",
  "Mediterranean",
  "Farmhouse",
  "Traditional",
  "Eclectic",
  "Vintage",
  "Retro",
  "Art Deco",
  "Zen",
  "Urban",
  "Tropical",
  "Wabi-Sabi",
  "Glam",
  "Cottagecore",
  "French Country",
  "Moroccan",
  "Desert Chic",
  "Modern Classic",
  "Transitional",
  "Scandinavian Minimal",
  "Nature-Inspired",
  "Luxury",
  "Futuristic",
  "Organic Modern",
  "Asian Contemporary",
  "Industrial Loft",
  "Hollywood Regency",
  "Shabby Chic",
  "Maximalist",
  "Nautical/Hamptons",
];

// Exterior / facade styles
export const EXTERIOR_STYLES = [
  "Modern",
  "Minimalist",
  "Scandinavian",
  "Industrial",
  "Contemporary",
  "Rustic",
  "Coastal",
  "Mediterranean",
  "Farmhouse",
  "Traditional",
  "Urban",
  "Tropical",
  "Moroccan",
  "Desert Chic",
  "Modern Classic",
  "Transitional",
  "Nature-Inspired",
  "Luxury",
  "Futuristic",
  "Organic Modern",
  "Industrial Loft",
  "Nautical/Hamptons",
];

// Garden / landscaping styles
export const GARDEN_STYLES = [
  "Nature-Inspired",
  "Rustic",
  "Mediterranean",
  "Coastal",
  "Tropical",
  "Cottagecore",
  "Zen",
  "English Garden",
  "Japanese Garden",
];

// ----------------------
// Combined design styles
// ----------------------

// Combinăm toate stilurile din interior / exterior / grădină
const allStyles = Array.from(
  new Set([...INTERIOR_STYLES, ...EXTERIOR_STYLES, ...GARDEN_STYLES]),
);

// Sort styles alphabetically and keep "No Style" at the end for clarity.
export const DESIGN_STYLES = [...allStyles].sort().concat("No Style");

// ----------------------
// Holidays / Events / Themes
// ----------------------

export const HOLIDAYS = [
  "None",
  "Christmas",
  "New Year’s Eve",
  "Valentine’s Day",
  "Easter",
  "Halloween",
  "Thanksgiving",
  "Independence Day (4th of July)",
  "Hanukkah",
  "Ramadan / Eid",
  "Diwali",
  "St. Patrick’s Day",
  "Mother’s Day",
  "Father’s Day",
  "Earth Day",
  "Chinese New Year",
  "Lunar New Year",
  "Spring Equinox",
  "Summer Solstice",
  "Autumn Harvest",
  "Winter Solstice",
  "Mardi Gras",
  "Pride Month",
  "Black Friday",
  "Cyber Monday",
  "Labor Day",
  "Memorial Day",
  "Veteran’s Day",
  "Carnival",
  "Thanksgiving Weekend",
  "Halloween Eve",
];

export const EVENTS = [
  "None",
  "Birthday Party",
  "Wedding",
  "Baby Shower",
  "Engagement Party",
  "Bridal Shower",
  "Anniversary Celebration",
  "Graduation Party",
  "Dinner Party",
  "Housewarming",
  "Holiday Gathering",
  "Outdoor BBQ",
  "Garden Party",
  "Gender Reveal",
  "Family Reunion",
  "Romantic Dinner",
  "Corporate Event",
  "Art Exhibition",
  "Product Launch",
  "Photo Shoot Setup",
  "Pop-up Market / Fair",
  "Charity Gala",
  "Kids Party",
  "Themed Party (e.g., 80s, Tropical, Rustic)",
  "Movie Night",
  "Cozy Night In",
  "Friendsgiving",
  "New Year’s Brunch",
  "Music Event",
  "Festival Booth",
  "Community Gathering",
  "Baby’s First Birthday",
  "Farewell Party",
];

export const SEASONAL_THEMES = [
  "None",
  "Spring Refresh",
  "Summer Beach Vibes",
  "Autumn Cozy",
  "Winter Wonderland",
  "Modern Farmhouse",
  "Bohemian Chic",
  "Minimalist Zen",
  "Vintage Charm",
  "Tropical Paradise",
  "Romantic Ambiance",
  "Garden Party",
  "Urban Modern",
  "Pastel Dreams",

  // Added themes
  "Spring Blossoms",
  "Summer Garden Party",
  "Golden Autumn Harvest",
  "Cozy Cabin Winter",
  "Scandi Winter Hygge",
  "Holiday Sparkle",
  "Neutral All-Season",
  "Earthy Boho Vibes",
  "Monochrome Minimal",
  "Soft Neutrals",
  "Bold Color Pop",
  "Moody & Dramatic",
  "Fresh Greenery",
  "Festive Glam",
];
