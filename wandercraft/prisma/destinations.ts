/**
 * The seeded destination catalogue.
 *
 * `blueprint` is a five-day sample plan stored as JSON on the Destination row.
 * When someone clicks "Start Planning This Trip" we clone these entries into
 * real ItineraryActivity rows, so the coordinates here are the ones that end
 * up on the map.
 *
 * `heroGradient` is a CSS gradient rather than a photo URL: it renders instantly,
 * never 404s, and keeps the app free of external image hosts.
 */

export type BlueprintActivity = {
  day: number;
  startTime: string;
  endTime: string;
  category: "SIGHTSEEING" | "DINING" | "TRANSIT" | "LODGING" | "ACTIVITY" | "REST";
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  cost: number;
  notes?: string;
};

export type Blueprint = {
  dayTitles: string[];
  activities: BlueprintActivity[];
  seasonalTips: string[];
  packingHints: string[];
};

export type DestinationSeed = {
  slug: string;
  name: string;
  country: string;
  continent: string;
  bestSeason: string;
  avgDailyBudget: number;      // USD, so destinations compare like for like
  avgDailyBudgetLocal: number; // the same figure in `currency`
  currency: string;
  heroGradient: string;
  summary: string;
  latitude: number;
  longitude: number;
  tags: string[];
  blueprint: Blueprint;
};

const a = (
  day: number,
  startTime: string,
  endTime: string,
  category: BlueprintActivity["category"],
  name: string,
  locationName: string,
  latitude: number,
  longitude: number,
  cost: number,
  notes?: string
): BlueprintActivity => ({ day, startTime, endTime, category, name, locationName, latitude, longitude, cost, notes });

export const DESTINATIONS: DestinationSeed[] = [
  {
    slug: "kyoto-japan",
    name: "Kyoto",
    country: "Japan",
    continent: "Asia",
    bestSeason: "Late March–April (cherry blossom) and November (autumn maples)",
    avgDailyBudget: 145,
    avgDailyBudgetLocal: 21000,
    currency: "JPY",
    heroGradient: "linear-gradient(145deg, #C4432B 0%, #E08A5B 45%, #2D5A46 100%)",
    summary:
      "A thousand years of imperial capital compressed into walkable neighbourhoods — moss temples, a market street that feeds the whole city, and bamboo taller than the buildings.",
    latitude: 35.0116,
    longitude: 135.7681,
    tags: ["Trending", "Culture", "Foodie"],
    blueprint: {
      dayTitles: [
        "Southern Higashiyama & the torii gates",
        "Arashiyama bamboo and the western temples",
        "Golden pavilion & rock gardens",
        "Nishiki market and the geisha quarter",
        "Day trip to Nara",
      ],
      activities: [
        a(1, "07:30", "10:00", "SIGHTSEEING", "Fushimi Inari torii gate climb", "Fushimi Inari Taisha", 34.9671, 135.7727, 0, "Arrive before 8am — by 10 the lower gates are shoulder to shoulder."),
        a(1, "11:00", "13:00", "SIGHTSEEING", "Kiyomizu-dera & Sannenzaka lanes", "Kiyomizu-dera", 34.9949, 135.785, 400),
        a(1, "18:30", "20:30", "DINING", "Kaiseki dinner in Gion", "Gion district", 35.0037, 135.7752, 8000),
        a(2, "08:30", "10:00", "SIGHTSEEING", "Arashiyama bamboo grove", "Sagano Bamboo Forest", 35.017, 135.672, 0),
        a(2, "10:15", "11:45", "SIGHTSEEING", "Tenryū-ji temple gardens", "Tenryū-ji", 35.0158, 135.6738, 800),
        a(2, "13:00", "15:00", "ACTIVITY", "Sagano scenic railway", "Torokko Saga Station", 35.0186, 135.6795, 880),
        a(3, "09:00", "10:30", "SIGHTSEEING", "Kinkaku-ji, the golden pavilion", "Kinkaku-ji", 35.0394, 135.7292, 500),
        a(3, "11:00", "12:30", "SIGHTSEEING", "Ryōan-ji rock garden", "Ryōan-ji", 35.0345, 135.7182, 600),
        a(3, "14:00", "16:00", "SIGHTSEEING", "Nijō Castle nightingale floors", "Nijō Castle", 35.0142, 135.7481, 1300),
        a(4, "10:00", "12:00", "DINING", "Graze Nishiki Market", "Nishiki Market", 35.005, 135.7649, 3000),
        a(4, "14:00", "16:30", "SIGHTSEEING", "Philosopher's Path to Ginkaku-ji", "Ginkaku-ji", 35.027, 135.7982, 500),
        a(4, "19:00", "21:00", "DINING", "Riverside dinner on Pontochō", "Pontochō Alley", 35.0047, 135.7707, 6000),
        a(5, "08:00", "09:00", "TRANSIT", "Train to Nara", "Kyoto Station", 34.9858, 135.7588, 720),
        a(5, "09:30", "13:00", "SIGHTSEEING", "Tōdai-ji and the deer park", "Nara Park", 34.6851, 135.8048, 600),
        a(5, "14:00", "16:00", "SIGHTSEEING", "Kasuga Taisha lantern path", "Kasuga Taisha", 34.6815, 135.8484, 500),
      ],
      seasonalTips: [
        "Blossom season peaks around the first week of April and books out six months ahead.",
        "November foliage is just as busy — temples open early specifically for it.",
        "July and August are humid and 35°C; temple gardens are still lovely at 8am.",
      ],
      packingHints: ["Shoes you can slip off constantly", "Coin purse — cash still rules at temples", "Compact umbrella"],
    },
  },
  {
    slug: "lisbon-portugal",
    name: "Lisbon",
    country: "Portugal",
    continent: "Europe",
    bestSeason: "March–June and September–October",
    avgDailyBudget: 95,
    avgDailyBudgetLocal: 88,
    currency: "EUR",
    heroGradient: "linear-gradient(145deg, #E07A3F 0%, #D95338 40%, #2E6F8E 100%)",
    summary:
      "Seven hills of tiled facades above the Tagus, where a custard tart costs a euro and the tram takes the corners like it's late for something.",
    latitude: 38.7223,
    longitude: -9.1393,
    tags: ["Budget-Friendly", "Foodie", "Culture"],
    blueprint: {
      dayTitles: ["Alfama & the castle", "Belém and the monuments", "Sintra day trip", "Bairro Alto & LX Factory", "Coast at Cascais"],
      activities: [
        a(1, "09:30", "11:30", "SIGHTSEEING", "Wander Alfama's stairs", "Alfama", 38.7118, -9.13, 0),
        a(1, "12:00", "14:00", "SIGHTSEEING", "São Jorge Castle ramparts", "Castelo de São Jorge", 38.7139, -9.1335, 15),
        a(1, "19:00", "21:00", "DINING", "Fado dinner", "Alfama", 38.7112, -9.1289, 45),
        a(2, "09:00", "10:30", "SIGHTSEEING", "Jerónimos Monastery cloisters", "Mosteiro dos Jerónimos", 38.6979, -9.2065, 12),
        a(2, "11:00", "12:00", "DINING", "Pastéis de Belém, straight from the oven", "Pastéis de Belém", 38.6975, -9.2032, 6),
        a(2, "13:00", "15:00", "SIGHTSEEING", "Belém Tower & Discoveries Monument", "Torre de Belém", 38.6916, -9.216, 8),
        a(3, "08:30", "09:30", "TRANSIT", "Train to Sintra", "Rossio Station", 38.7143, -9.1414, 5),
        a(3, "10:00", "13:00", "SIGHTSEEING", "Pena Palace and its gardens", "Palácio da Pena", 38.7876, -9.3904, 20),
        a(3, "14:00", "16:30", "SIGHTSEEING", "Quinta da Regaleira initiation well", "Quinta da Regaleira", 38.7962, -9.3963, 15),
        a(4, "11:00", "13:00", "DINING", "Lunch loop at Time Out Market", "Mercado da Ribeira", 38.7071, -9.1459, 25),
        a(4, "15:00", "17:30", "ACTIVITY", "LX Factory studios & bookshop", "LX Factory", 38.7033, -9.1789, 0),
        a(4, "21:00", "23:30", "ACTIVITY", "Bairro Alto bar crawl", "Bairro Alto", 38.713, -9.145, 30),
        a(5, "10:00", "11:00", "TRANSIT", "Coast train to Cascais", "Cais do Sodré", 38.7057, -9.1455, 5),
        a(5, "11:30", "15:00", "REST", "Beach afternoon", "Praia da Rainha", 38.6961, -9.4198, 0),
        a(5, "18:00", "19:30", "SIGHTSEEING", "Sunset at Senhora do Monte", "Miradouro da Senhora do Monte", 38.7169, -9.1325, 0),
      ],
      seasonalTips: [
        "August empties of locals and fills with queues — May and September are the sweet spot.",
        "Sintra is 5°C cooler and frequently fogged in; bring a layer even in July.",
      ],
      packingHints: ["Grippy soles for the cobbles", "Light rain shell for spring", "Reusable water bottle"],
    },
  },
  {
    slug: "mexico-city-mexico",
    name: "Mexico City",
    country: "Mexico",
    continent: "North America",
    bestSeason: "March–May, before the summer rains",
    avgDailyBudget: 80,
    avgDailyBudgetLocal: 1450,
    currency: "MXN",
    heroGradient: "linear-gradient(145deg, #D9403C 0%, #E88A2B 50%, #2D5A46 100%)",
    summary:
      "An Aztec capital under a colonial grid under a very good modern restaurant scene. Volcanic, vast, and cheaper than you expect.",
    latitude: 19.4326,
    longitude: -99.1332,
    tags: ["Budget-Friendly", "Foodie", "Culture"],
    blueprint: {
      dayTitles: ["Centro Histórico", "Coyoacán & Frida", "Teotihuacán pyramids", "Chapultepec & anthropology", "Xochimilco and Roma Norte"],
      activities: [
        a(1, "09:00", "10:30", "SIGHTSEEING", "Zócalo and the Cathedral", "Plaza de la Constitución", 19.4326, -99.1332, 0),
        a(1, "11:00", "13:00", "SIGHTSEEING", "Templo Mayor ruins & museum", "Templo Mayor", 19.4348, -99.1316, 90),
        a(1, "16:00", "17:30", "SIGHTSEEING", "Palacio de Bellas Artes murals", "Palacio de Bellas Artes", 19.4352, -99.1412, 90),
        a(2, "10:00", "12:00", "SIGHTSEEING", "Casa Azul, Frida Kahlo Museum", "Museo Frida Kahlo", 19.3552, -99.1624, 320, "Timed tickets sell out days ahead — book online."),
        a(2, "12:30", "14:30", "DINING", "Mercado de Coyoacán tostadas", "Mercado de Coyoacán", 19.3502, -99.1618, 150),
        a(2, "15:00", "17:00", "SIGHTSEEING", "Coyoacán plazas and Leon Trotsky house", "Coyoacán", 19.35, -99.162, 70),
        a(3, "07:30", "09:00", "TRANSIT", "Bus to Teotihuacán", "Terminal Norte", 19.4841, -99.139, 110),
        a(3, "09:30", "13:30", "SIGHTSEEING", "Pyramids of the Sun and Moon", "Teotihuacán", 19.6925, -98.8438, 100),
        a(3, "14:00", "15:30", "DINING", "Lunch in a lava cave restaurant", "La Gruta", 19.6885, -98.8398, 400),
        a(4, "09:30", "12:30", "SIGHTSEEING", "National Museum of Anthropology", "Museo Nacional de Antropología", 19.426, -99.1863, 95),
        a(4, "13:00", "15:00", "ACTIVITY", "Chapultepec park and castle", "Bosque de Chapultepec", 19.4204, -99.1819, 95),
        a(4, "20:00", "22:00", "DINING", "Tasting menu in Polanco", "Polanco", 19.4333, -99.1922, 1800),
        a(5, "09:00", "12:00", "ACTIVITY", "Trajinera boat through the canals", "Xochimilco", 19.257, -99.103, 600),
        a(5, "14:00", "16:00", "DINING", "Taco crawl in Roma Norte", "Roma Norte", 19.419, -99.162, 250),
        a(5, "17:00", "18:30", "ACTIVITY", "Mercado de San Juan delicacies", "Mercado de San Juan", 19.431, -99.144, 200),
      ],
      seasonalTips: [
        "Altitude is 2,240m — take the first day gently and drink more water than feels necessary.",
        "June to September rains arrive hard around 5pm and stop by 7pm. Plan mornings outdoors.",
      ],
      packingHints: ["Layers — mornings are cold, afternoons hot", "High-SPF sunscreen for the altitude", "Small bills for markets"],
    },
  },
  {
    slug: "reykjavik-iceland",
    name: "Reykjavík",
    country: "Iceland",
    continent: "Europe",
    bestSeason: "June–August for midnight sun, September–March for aurora",
    avgDailyBudget: 210,
    avgDailyBudgetLocal: 29000,
    currency: "ISK",
    heroGradient: "linear-gradient(145deg, #2E6F8E 0%, #4A8FA8 45%, #1C2124 100%)",
    summary:
      "A small capital used as a launchpad: waterfalls, black sand, geothermal steam and a road that loops past all of it in a day.",
    latitude: 64.1466,
    longitude: -21.9426,
    tags: ["Nature & Hiking", "Trending"],
    blueprint: {
      dayTitles: ["Reykjavík on foot", "The Golden Circle", "South coast waterfalls", "Black sand and basalt", "Lagoons and departure"],
      activities: [
        a(1, "10:00", "11:30", "SIGHTSEEING", "Hallgrímskirkja tower view", "Hallgrímskirkja", 64.1417, -21.9266, 1200),
        a(1, "12:00", "13:30", "SIGHTSEEING", "Harpa concert hall & old harbour", "Harpa", 64.1504, -21.9325, 0),
        a(1, "19:00", "21:00", "DINING", "Seafood on Laugavegur", "Laugavegur", 64.1443, -21.9265, 9500),
        a(2, "09:00", "11:00", "SIGHTSEEING", "Þingvellir continental rift", "Þingvellir National Park", 64.2559, -21.13, 1000),
        a(2, "12:00", "13:00", "SIGHTSEEING", "Strokkur geyser eruptions", "Geysir", 64.3104, -20.3024, 0),
        a(2, "14:00", "15:30", "SIGHTSEEING", "Gullfoss double waterfall", "Gullfoss", 64.3271, -20.1199, 0),
        a(3, "09:30", "11:00", "SIGHTSEEING", "Walk behind Seljalandsfoss", "Seljalandsfoss", 63.6156, -19.9886, 900),
        a(3, "11:30", "13:00", "SIGHTSEEING", "Skógafoss and the clifftop stairs", "Skógafoss", 63.5321, -19.5114, 0),
        a(3, "15:00", "17:00", "ACTIVITY", "Sólheimajökull glacier walk", "Sólheimajökull", 63.5312, -19.3678, 14900),
        a(4, "10:00", "12:00", "SIGHTSEEING", "Reynisfjara basalt columns", "Reynisfjara", 63.4054, -19.0448, 0, "Never turn your back on the sneaker waves here."),
        a(4, "13:00", "14:30", "DINING", "Lunch in Vík", "Vík í Mýrdal", 63.4187, -19.0060, 4200),
        a(4, "21:30", "23:30", "ACTIVITY", "Aurora watch away from town lights", "Vík", 63.4187, -19.006, 0),
        a(5, "11:00", "14:00", "REST", "Sky Lagoon geothermal soak", "Sky Lagoon", 64.124, -21.933, 12990),
        a(5, "15:00", "16:30", "ACTIVITY", "Reykjavík Art Museum", "Hafnarhús", 64.1487, -21.9403, 2400),
        a(5, "18:00", "19:00", "DINING", "Farewell hot dog at Bæjarins Beztu", "Bæjarins Beztu Pylsur", 64.1479, -21.9394, 750),
      ],
      seasonalTips: [
        "November to February gives roughly 5 hours of daylight — plan two sights a day, not five.",
        "Aurora needs darkness and clear skies; September and March balance both best.",
        "Wind, not temperature, is what makes Iceland cold. A windproof shell matters more than a thick coat.",
      ],
      packingHints: ["Windproof outer shell", "Waterproof boots", "Swimsuit — every town has a geothermal pool", "Eye mask for the midnight sun"],
    },
  },
  {
    slug: "marrakesh-morocco",
    name: "Marrakesh",
    country: "Morocco",
    continent: "Africa",
    bestSeason: "March–May and October–November",
    avgDailyBudget: 70,
    avgDailyBudgetLocal: 700,
    currency: "MAD",
    heroGradient: "linear-gradient(145deg, #D95338 0%, #E8A33D 50%, #2E6F8E 100%)",
    summary:
      "A walled medina that runs on negotiation, with the Atlas Mountains an hour away and a courtyard riad waiting behind every unmarked door.",
    latitude: 31.6295,
    longitude: -7.9811,
    tags: ["Budget-Friendly", "Culture", "Foodie"],
    blueprint: {
      dayTitles: ["The medina & Jemaa el-Fnaa", "Palaces and tombs", "Gardens and the new city", "Atlas Mountains", "Souks and hammam"],
      activities: [
        a(1, "10:00", "12:00", "SIGHTSEEING", "Koutoubia Mosque and gardens", "Koutoubia", 31.6237, -7.9938, 0),
        a(1, "16:00", "18:00", "ACTIVITY", "Get lost in the souks", "Souk Semmarine", 31.6295, -7.986, 0),
        a(1, "19:00", "21:30", "DINING", "Food stalls on Jemaa el-Fnaa", "Jemaa el-Fnaa", 31.6258, -7.9891, 120),
        a(2, "09:30", "11:00", "SIGHTSEEING", "Bahia Palace courtyards", "Bahia Palace", 31.6215, -7.9829, 100),
        a(2, "11:30", "12:30", "SIGHTSEEING", "Saadian Tombs", "Saadian Tombs", 31.6178, -7.989, 100),
        a(2, "15:00", "16:30", "SIGHTSEEING", "Medersa Ben Youssef", "Ben Youssef Madrasa", 31.6317, -7.9866, 100),
        a(3, "10:00", "11:30", "SIGHTSEEING", "Jardin Majorelle & YSL Museum", "Jardin Majorelle", 31.6417, -8.0033, 300, "Book the first slot — the garden is small and gets crowded fast."),
        a(3, "12:30", "14:00", "SIGHTSEEING", "Le Jardin Secret", "Le Jardin Secret", 31.6303, -7.9873, 80),
        a(3, "17:00", "19:00", "REST", "Sunset over Menara Gardens", "Menara Gardens", 31.6136, -8.0186, 70),
        a(4, "08:00", "10:00", "TRANSIT", "Drive to Imlil", "Imlil", 31.137, -7.919, 400),
        a(4, "10:00", "15:00", "ACTIVITY", "Guided valley hike and Berber lunch", "Imlil Valley", 31.14, -7.925, 500),
        a(4, "19:00", "21:00", "DINING", "Rooftop tagine back in the medina", "Medina rooftop", 31.6262, -7.9873, 200),
        a(5, "10:00", "12:00", "ACTIVITY", "Traditional hammam and scrub", "Medina hammam", 31.628, -7.985, 350),
        a(5, "14:00", "16:30", "ACTIVITY", "Spice and rug shopping, properly haggled", "Rahba Kedima", 31.6289, -7.9862, 600),
        a(5, "18:00", "19:30", "DINING", "Mint tea and pastries", "Café des Épices", 31.6289, -7.9866, 60),
      ],
      seasonalTips: [
        "July and August regularly hit 42°C. Riads with plunge pools stop being a luxury.",
        "Ramadan changes opening hours across the medina — check the dates before booking.",
      ],
      packingHints: ["Modest layers that cover shoulders and knees", "Scarf for sun and dust", "Small notes for tips and taxis"],
    },
  },
  {
    slug: "queenstown-new-zealand",
    name: "Queenstown",
    country: "New Zealand",
    continent: "Oceania",
    bestSeason: "December–February for hiking, June–August for skiing",
    avgDailyBudget: 165,
    avgDailyBudgetLocal: 275,
    currency: "NZD",
    heroGradient: "linear-gradient(145deg, #2D5A46 0%, #4A8FA8 50%, #1C2124 100%)",
    summary:
      "A lake town ringed by mountains that treats adrenaline as infrastructure. Also the trailhead for the best day walks in the country.",
    latitude: -45.0312,
    longitude: 168.6626,
    tags: ["Nature & Hiking", "Trending"],
    blueprint: {
      dayTitles: ["Lake and gondola", "Milford Sound", "Glenorchy & Routeburn", "Arrowtown and the wineries", "Adrenaline day"],
      activities: [
        a(1, "10:00", "12:00", "SIGHTSEEING", "Skyline Gondola to Bob's Peak", "Skyline Queenstown", -45.029, 168.654, 55),
        a(1, "14:00", "16:00", "REST", "Lakefront walk to the gardens", "Queenstown Gardens", -45.0355, 168.6631, 0),
        a(1, "18:30", "20:00", "DINING", "Fergburger and lakeside beers", "Fergburger", -45.0312, 168.6614, 30),
        a(2, "07:00", "10:30", "TRANSIT", "Coach through the Homer Tunnel", "Te Anau Road", -45.0, 168.0, 0),
        a(2, "11:00", "13:00", "ACTIVITY", "Milford Sound fjord cruise", "Milford Sound", -44.6714, 167.925, 120),
        a(2, "16:00", "19:00", "TRANSIT", "Return drive with Mirror Lakes stop", "Mirror Lakes", -45.1633, 167.9333, 0),
        a(3, "08:30", "09:30", "TRANSIT", "Drive the Glenorchy road", "Glenorchy", -44.85, 168.3833, 0),
        a(3, "10:00", "15:00", "ACTIVITY", "Routeburn Track day section", "Routeburn Shelter", -44.78, 168.22, 0),
        a(3, "16:00", "17:30", "DINING", "Late lunch in Glenorchy", "Glenorchy", -44.8683, 168.3831, 35),
        a(4, "10:00", "12:00", "SIGHTSEEING", "Arrowtown gold-rush main street", "Arrowtown", -44.94, 168.83, 0),
        a(4, "13:00", "16:00", "ACTIVITY", "Gibbston Valley pinot tasting", "Gibbston Valley", -45.02, 168.81, 45),
        a(4, "16:30", "17:30", "ACTIVITY", "Kawarau bridge bungy watch", "Kawarau Gorge", -45.0206, 168.6633, 0),
        a(5, "09:30", "10:30", "ACTIVITY", "Shotover Jet canyon run", "Shotover River", -44.98, 168.69, 169),
        a(5, "13:00", "15:00", "ACTIVITY", "Luge runs from the gondola", "Bob's Peak", -45.029, 168.654, 40),
        a(5, "19:00", "21:00", "DINING", "Final dinner over the lake", "Queenstown waterfront", -45.0322, 168.6595, 80),
      ],
      seasonalTips: [
        "Milford Sound is spectacular in rain — that's when the temporary waterfalls appear.",
        "December to February is peak; book the Routeburn huts and the Milford coach months ahead.",
        "Sandflies on the fiord are relentless. Repellent is not optional.",
      ],
      packingHints: ["Broken-in hiking boots", "Insect repellent", "Layers — four seasons in one afternoon", "Strong sunscreen"],
    },
  },
  {
    slug: "hanoi-vietnam",
    name: "Hanoi",
    country: "Vietnam",
    continent: "Asia",
    bestSeason: "October–December, dry and mild",
    avgDailyBudget: 55,
    avgDailyBudgetLocal: 1400000,
    currency: "VND",
    heroGradient: "linear-gradient(145deg, #2D5A46 0%, #E8A33D 55%, #D95338 100%)",
    summary:
      "A thousand-year-old quarter of 36 trade streets, motorbike rivers, and the best two-dollar bowl of noodles you will ever queue for.",
    latitude: 21.0278,
    longitude: 105.8342,
    tags: ["Budget-Friendly", "Foodie", "Culture"],
    blueprint: {
      dayTitles: ["Old Quarter orientation", "Temples and the mausoleum", "Ha Long Bay", "Ninh Binh karsts", "Markets and street food"],
      activities: [
        a(1, "09:00", "11:00", "SIGHTSEEING", "Hoan Kiem Lake and Ngoc Son Temple", "Hoan Kiem Lake", 21.0287, 105.8524, 30000),
        a(1, "14:00", "16:00", "ACTIVITY", "Walk the 36 streets of the Old Quarter", "Old Quarter", 21.0333, 105.85, 0),
        a(1, "18:00", "19:30", "DINING", "Bun cha, the Obama order", "Bun Cha Huong Lien", 21.0155, 105.848, 90000),
        a(2, "08:00", "10:00", "SIGHTSEEING", "Ho Chi Minh Mausoleum complex", "Ba Dinh Square", 21.0367, 105.8347, 40000),
        a(2, "10:30", "12:00", "SIGHTSEEING", "Temple of Literature", "Van Mieu", 21.0277, 105.8355, 70000),
        a(2, "16:00", "17:30", "ACTIVITY", "Train Street coffee as the train passes", "Train Street", 21.029, 105.842, 60000),
        a(3, "07:00", "10:00", "TRANSIT", "Transfer to Ha Long Bay", "Ha Long", 20.9101, 107.1839, 0),
        a(3, "11:00", "17:00", "ACTIVITY", "Junk boat cruise through the karsts", "Ha Long Bay", 20.9101, 107.1839, 1800000),
        a(3, "18:00", "20:00", "DINING", "Seafood dinner on board", "Ha Long Bay", 20.92, 107.19, 0),
        a(4, "07:30", "09:30", "TRANSIT", "Drive south to Ninh Binh", "Ninh Binh", 20.2506, 105.9745, 0),
        a(4, "10:00", "13:00", "ACTIVITY", "Rowboat through Tam Coc caves", "Tam Coc", 20.2205, 105.9333, 250000),
        a(4, "14:00", "16:00", "ACTIVITY", "Hang Mua viewpoint climb", "Hang Mua", 20.2331, 105.9375, 100000),
        a(5, "08:00", "10:00", "DINING", "Pho breakfast and egg coffee", "Giang Cafe", 21.0339, 105.8517, 60000),
        a(5, "10:30", "12:30", "ACTIVITY", "Dong Xuan Market", "Dong Xuan Market", 21.0383, 105.8497, 0),
        a(5, "19:00", "21:00", "ACTIVITY", "Water puppet theatre", "Thang Long Theatre", 21.0301, 105.8535, 200000),
      ],
      seasonalTips: [
        "June to August is hot, wet and prone to typhoons on the coast — Ha Long cruises get cancelled.",
        "January and February can be a damp 15°C. A light jacket surprises most visitors.",
      ],
      packingHints: ["Face mask for traffic dust", "Sandals that survive rain", "Cash — many stalls take nothing else"],
    },
  },
  {
    slug: "barcelona-spain",
    name: "Barcelona",
    country: "Spain",
    continent: "Europe",
    bestSeason: "May–June and September",
    avgDailyBudget: 120,
    avgDailyBudgetLocal: 111,
    currency: "EUR",
    heroGradient: "linear-gradient(145deg, #D95338 0%, #E8A33D 45%, #2E6F8E 100%)",
    summary:
      "Gaudí's unfinished cathedral, a Gothic maze, and a beach you can walk to from lunch. Dinner starts at ten and nobody thinks that's late.",
    latitude: 41.3874,
    longitude: 2.1686,
    tags: ["Trending", "Culture", "Foodie"],
    blueprint: {
      dayTitles: ["Gaudí's masterworks", "Gothic Quarter & El Born", "Montjuïc and the sea", "Beach and Barceloneta", "Girona day trip"],
      activities: [
        a(1, "09:00", "11:00", "SIGHTSEEING", "Sagrada Família with tower access", "Sagrada Família", 41.4036, 2.1744, 36, "Book the first slot for the eastern stained glass."),
        a(1, "12:00", "13:30", "SIGHTSEEING", "Casa Batlló", "Casa Batlló", 41.3917, 2.165, 35),
        a(1, "16:00", "18:00", "SIGHTSEEING", "Park Güell terrace", "Park Güell", 41.4145, 2.1527, 10),
        a(2, "10:00", "12:00", "SIGHTSEEING", "Gothic Quarter and the cathedral", "Barri Gòtic", 41.3833, 2.1767, 9),
        a(2, "12:30", "14:00", "DINING", "La Boqueria market lunch", "Mercat de la Boqueria", 41.3818, 2.1716, 20),
        a(2, "16:00", "18:00", "SIGHTSEEING", "Picasso Museum and El Born lanes", "Museu Picasso", 41.3851, 2.181, 12),
        a(3, "10:00", "12:00", "SIGHTSEEING", "Montjuïc castle and cable car", "Montjuïc", 41.364, 2.158, 14),
        a(3, "13:00", "15:00", "SIGHTSEEING", "Joan Miró Foundation", "Fundació Joan Miró", 41.3687, 2.16, 14),
        a(3, "21:00", "23:00", "DINING", "Tapas crawl in Poble Sec", "Carrer de Blai", 41.3735, 2.1626, 35),
        a(4, "10:00", "13:00", "REST", "Barceloneta beach morning", "Platja de la Barceloneta", 41.3785, 2.1925, 0),
        a(4, "14:00", "16:00", "DINING", "Paella by the water", "Barceloneta", 41.3795, 2.19, 40),
        a(4, "18:00", "20:00", "ACTIVITY", "Sunset from the Bunkers del Carmel", "Bunkers del Carmel", 41.4194, 2.1622, 0),
        a(5, "08:30", "10:00", "TRANSIT", "High-speed train to Girona", "Barcelona Sants", 41.379, 2.1401, 20),
        a(5, "10:30", "14:00", "SIGHTSEEING", "Girona walls and the Jewish Quarter", "Girona", 41.9794, 2.8214, 7),
        a(5, "15:00", "17:00", "DINING", "Long Catalan lunch", "Girona old town", 41.9862, 2.8247, 45),
      ],
      seasonalTips: [
        "August is hot and half the good restaurants close for holidays.",
        "La Mercè in late September fills the city with free street performance.",
      ],
      packingHints: ["Crossbody bag with a zip — pickpockets work the Ramblas", "Swimsuit", "Shoulder cover for church entry"],
    },
  },
  {
    slug: "cape-town-south-africa",
    name: "Cape Town",
    country: "South Africa",
    continent: "Africa",
    bestSeason: "November–March, dry and warm",
    avgDailyBudget: 90,
    avgDailyBudgetLocal: 1650,
    currency: "ZAR",
    heroGradient: "linear-gradient(145deg, #2E6F8E 0%, #2D5A46 45%, #E8A33D 100%)",
    summary:
      "A flat-topped mountain dropped between two oceans, with penguins on one beach, wine farms half an hour inland, and a very complicated history told well.",
    latitude: -33.9249,
    longitude: 18.4241,
    tags: ["Nature & Hiking", "Budget-Friendly", "Culture"],
    blueprint: {
      dayTitles: ["Table Mountain", "Robben Island & the city", "Cape Peninsula", "Winelands", "Beaches and gardens"],
      activities: [
        a(1, "07:30", "11:00", "ACTIVITY", "Platteklip Gorge hike up Table Mountain", "Table Mountain", -33.9628, 18.4098, 0, "Start at dawn — no shade on the entire climb."),
        a(1, "11:30", "13:00", "SIGHTSEEING", "Summit walks and cable car down", "Table Mountain Upper Station", -33.9575, 18.4032, 220),
        a(1, "18:00", "20:00", "DINING", "Sunset dinner at the V&A Waterfront", "V&A Waterfront", -33.9036, 18.4201, 350),
        a(2, "09:00", "12:30", "SIGHTSEEING", "Robben Island ferry and tour", "Robben Island", -33.806, 18.3667, 600),
        a(2, "14:00", "15:30", "SIGHTSEEING", "Bo-Kaap colour houses & museum", "Bo-Kaap", -33.921, 18.415, 60),
        a(2, "16:00", "17:30", "SIGHTSEEING", "District Six Museum", "District Six Museum", -33.9285, 18.4258, 60),
        a(3, "08:30", "10:00", "TRANSIT", "Chapman's Peak coastal drive", "Chapman's Peak Drive", -34.08, 18.36, 61),
        a(3, "10:30", "13:00", "SIGHTSEEING", "Cape Point and the Cape of Good Hope", "Cape Point", -34.3568, 18.497, 400),
        a(3, "14:00", "15:30", "ACTIVITY", "African penguins at Boulders Beach", "Boulders Beach", -34.1975, 18.4515, 190),
        a(4, "10:00", "12:00", "ACTIVITY", "Stellenbosch wine tasting", "Stellenbosch", -33.9321, 18.8602, 250),
        a(4, "13:00", "15:00", "DINING", "Long lunch at a Franschhoek estate", "Franschhoek", -33.9139, 19.1225, 550),
        a(4, "16:00", "17:30", "ACTIVITY", "Franschhoek wine tram", "Franschhoek", -33.9139, 19.1225, 300),
        a(5, "09:30", "12:00", "SIGHTSEEING", "Kirstenbosch Botanical Gardens", "Kirstenbosch", -33.988, 18.4325, 220),
        a(5, "14:00", "17:00", "REST", "Camps Bay beach afternoon", "Camps Bay", -33.95, 18.378, 0),
        a(5, "18:30", "20:00", "SIGHTSEEING", "Signal Hill sunset", "Signal Hill", -33.9153, 18.4032, 0),
      ],
      seasonalTips: [
        "The southeaster wind blows hard from November to February and closes the cable car without warning.",
        "June to August is the rainy winter, but whale watching off Hermanus peaks then.",
      ],
      packingHints: ["Wind shell for the mountain", "Reef-safe sunscreen", "Adapter — South Africa uses its own plug"],
    },
  },
  {
    slug: "istanbul-turkiye",
    name: "Istanbul",
    country: "Türkiye",
    continent: "Europe",
    bestSeason: "April–May and September–October",
    avgDailyBudget: 75,
    avgDailyBudgetLocal: 2600,
    currency: "TRY",
    heroGradient: "linear-gradient(145deg, #2E6F8E 0%, #D95338 55%, #E8A33D 100%)",
    summary:
      "Two continents, three empires and a ferry commute across the Bosphorus that costs less than a coffee. Come hungry.",
    latitude: 41.0082,
    longitude: 28.9784,
    tags: ["Budget-Friendly", "Culture", "Foodie"],
    blueprint: {
      dayTitles: ["Sultanahmet monuments", "Bazaars and the spice trade", "Bosphorus and Galata", "Asian side", "Balat and the walls"],
      activities: [
        a(1, "09:00", "10:30", "SIGHTSEEING", "Hagia Sophia", "Hagia Sophia", 41.0086, 28.9802, 25),
        a(1, "11:00", "12:00", "SIGHTSEEING", "Blue Mosque", "Sultan Ahmed Mosque", 41.0054, 28.9768, 0),
        a(1, "14:00", "17:00", "SIGHTSEEING", "Topkapı Palace and the Harem", "Topkapı Palace", 41.0115, 28.9834, 45),
        a(2, "09:30", "10:30", "SIGHTSEEING", "Basilica Cistern", "Basilica Cistern", 41.0084, 28.9779, 30),
        a(2, "11:00", "13:30", "ACTIVITY", "Grand Bazaar, 4,000 shops deep", "Grand Bazaar", 41.0106, 28.9681, 0),
        a(2, "15:00", "16:30", "ACTIVITY", "Spice Bazaar and Turkish delight tasting", "Spice Bazaar", 41.0165, 28.9707, 200),
        a(3, "10:00", "12:00", "ACTIVITY", "Bosphorus ferry to Anadolu Kavağı", "Eminönü Pier", 41.0175, 28.9733, 60),
        a(3, "15:00", "16:30", "SIGHTSEEING", "Galata Tower panorama", "Galata Tower", 41.0256, 28.9741, 30),
        a(3, "19:00", "21:00", "DINING", "Meyhane dinner on İstiklal", "İstiklal Caddesi", 41.0335, 28.9779, 450),
        a(4, "10:00", "10:30", "TRANSIT", "Ferry to Kadıköy", "Kadıköy Pier", 40.99, 29.025, 30),
        a(4, "11:00", "14:00", "DINING", "Kadıköy food market crawl", "Kadıköy Market", 40.9903, 29.0258, 400),
        a(4, "15:00", "17:00", "ACTIVITY", "Moda seafront and antique shops", "Moda", 40.9805, 29.0264, 0),
        a(5, "10:00", "12:00", "SIGHTSEEING", "Balat's painted streets", "Balat", 41.029, 28.948, 0),
        a(5, "13:00", "14:30", "SIGHTSEEING", "Chora Church mosaics", "Kariye Mosque", 41.0311, 28.9394, 20),
        a(5, "16:00", "18:00", "REST", "Traditional hammam at Süleymaniye", "Süleymaniye Hamamı", 41.0165, 28.9639, 700),
      ],
      seasonalTips: [
        "July and August are humid and packed; the shoulder months are noticeably calmer.",
        "Mosques close to visitors during the five daily prayers — check times before queueing.",
      ],
      packingHints: ["Scarf for mosque visits", "Comfortable shoes — the hills are steeper than they look", "Istanbulkart for ferries and trams"],
    },
  },
  {
    slug: "copenhagen-denmark",
    name: "Copenhagen",
    country: "Denmark",
    continent: "Europe",
    bestSeason: "May–August for long days and harbour swimming",
    avgDailyBudget: 175,
    avgDailyBudgetLocal: 1200,
    currency: "DKK",
    heroGradient: "linear-gradient(145deg, #2E6F8E 0%, #7FB79A 45%, #E07A3F 100%)",
    summary:
      "A design capital you cross by bicycle, where the harbour is clean enough to swim in and dinner ranges from a hot dog cart to the best restaurant in the world.",
    latitude: 55.6761,
    longitude: 12.5683,
    tags: ["Trending", "Foodie", "Culture"],
    blueprint: {
      dayTitles: ["Harbour and city centre", "Palaces and design", "Louisiana Museum", "Christiania and Refshaleøen", "Malmö day trip"],
      activities: [
        a(1, "10:00", "11:30", "SIGHTSEEING", "Nyhavn canal houses", "Nyhavn", 55.6797, 12.5913, 0),
        a(1, "12:00", "13:30", "DINING", "Smørrebrød at Torvehallerne", "Torvehallerne", 55.6836, 12.5697, 150),
        a(1, "15:00", "18:00", "ACTIVITY", "Tivoli Gardens", "Tivoli", 55.6736, 12.5681, 155),
        a(2, "09:30", "11:00", "SIGHTSEEING", "Christiansborg tower and ruins", "Christiansborg Palace", 55.6759, 12.5794, 0),
        a(2, "11:30", "13:00", "SIGHTSEEING", "Rosenborg Castle crown jewels", "Rosenborg", 55.6857, 12.5773, 125),
        a(2, "15:00", "17:00", "ACTIVITY", "Designmuseum Danmark", "Designmuseum", 55.6866, 12.5936, 130),
        a(3, "09:30", "10:30", "TRANSIT", "Coast train north to Humlebæk", "Humlebæk", 55.9633, 12.5397, 108),
        a(3, "11:00", "15:00", "SIGHTSEEING", "Louisiana Museum of Modern Art", "Louisiana", 55.97, 12.543, 145),
        a(3, "16:00", "17:30", "REST", "Sculpture park by the Øresund", "Louisiana Gardens", 55.9702, 12.5442, 0),
        a(4, "10:00", "12:00", "ACTIVITY", "Christiania and the ramparts", "Freetown Christiania", 55.6736, 12.599, 0),
        a(4, "13:00", "15:00", "DINING", "Reffen street food and brewery", "Refshaleøen", 55.69, 12.61, 200),
        a(4, "16:00", "18:00", "ACTIVITY", "Harbour bath swim at Islands Brygge", "Islands Brygge", 55.6656, 12.5786, 0),
        a(5, "09:30", "10:15", "TRANSIT", "Train over the Øresund Bridge", "Malmö C", 55.6093, 13.0004, 110),
        a(5, "10:30", "14:00", "SIGHTSEEING", "Malmö old town and Turning Torso", "Malmö", 55.605, 13.0038, 0),
        a(5, "15:00", "17:00", "DINING", "Fika in Lilla Torg", "Lilla Torg", 55.6053, 12.9967, 90),
      ],
      seasonalTips: [
        "December daylight lasts about seven hours, but the Christmas markets are the reason to come then.",
        "Rent a bike on day one. The city is genuinely built around it and it halves your transport spend.",
      ],
      packingHints: ["Rain jacket in every season", "Swimsuit for the harbour baths", "Contactless card — cash is nearly extinct here"],
    },
  },
  {
    slug: "cusco-peru",
    name: "Cusco",
    country: "Peru",
    continent: "South America",
    bestSeason: "May–September, the dry season",
    avgDailyBudget: 85,
    avgDailyBudgetLocal: 320,
    currency: "PEN",
    heroGradient: "linear-gradient(145deg, #D9403C 0%, #E8A33D 45%, #2D5A46 100%)",
    summary:
      "The Inca capital at 3,400 metres, built on stonework nobody has managed to replicate, and the only sensible base for the Sacred Valley.",
    latitude: -13.5319,
    longitude: -71.9675,
    tags: ["Nature & Hiking", "Culture", "Budget-Friendly"],
    blueprint: {
      dayTitles: ["Acclimatise in Cusco", "Sacred Valley", "Machu Picchu", "Rainbow Mountain", "Markets and salt pans"],
      activities: [
        a(1, "10:00", "12:00", "SIGHTSEEING", "Plaza de Armas and the cathedral", "Plaza de Armas", -13.5164, -71.9785, 25),
        a(1, "14:00", "15:30", "SIGHTSEEING", "Qorikancha sun temple", "Qorikancha", -13.5203, -71.9752, 15),
        a(1, "16:00", "18:00", "REST", "Coca tea and an early night", "San Blas", -13.5153, -71.9756, 20, "Do nothing strenuous on day one. Altitude sickness ruins more trips here than anything else."),
        a(2, "08:00", "10:30", "SIGHTSEEING", "Pisac ruins and terraces", "Pisac", -13.422, -71.849, 70),
        a(2, "11:00", "13:00", "ACTIVITY", "Pisac artisan market", "Pisac Market", -13.4207, -71.8479, 60),
        a(2, "15:00", "17:30", "SIGHTSEEING", "Ollantaytambo fortress", "Ollantaytambo", -13.258, -72.265, 70),
        a(3, "05:00", "07:00", "TRANSIT", "Early train to Aguas Calientes", "Ollantaytambo Station", -13.2586, -72.2632, 220),
        a(3, "08:00", "13:00", "SIGHTSEEING", "Machu Picchu citadel circuit", "Machu Picchu", -13.1631, -72.545, 165, "Entry is by timed circuit and sells out weeks ahead in high season."),
        a(3, "16:00", "19:00", "TRANSIT", "Return train and transfer", "Ollantaytambo", -13.258, -72.265, 0),
        a(4, "04:00", "07:00", "TRANSIT", "Pre-dawn drive to the trailhead", "Cusipata", -13.9333, -71.4, 0),
        a(4, "07:30", "12:00", "ACTIVITY", "Vinicunca Rainbow Mountain hike", "Vinicunca", -13.869, -71.303, 120),
        a(4, "18:00", "20:00", "DINING", "Alpaca and quinoa dinner", "San Blas", -13.5148, -71.9761, 90),
        a(5, "09:00", "11:00", "SIGHTSEEING", "Maras salt pans", "Salineras de Maras", -13.2967, -72.155, 20),
        a(5, "11:30", "13:00", "SIGHTSEEING", "Moray circular terraces", "Moray", -13.33, -72.19, 70),
        a(5, "15:00", "17:00", "ACTIVITY", "San Pedro Market", "Mercado San Pedro", -13.519, -71.983, 40),
      ],
      seasonalTips: [
        "Give yourself two days at altitude before any hiking. Machu Picchu is lower, so go up gradually.",
        "January to March is the wet season and the Inca Trail closes entirely in February.",
      ],
      packingHints: ["Altitude sickness tablets", "Warm layers — nights drop near freezing", "Sun hat, the UV at altitude is brutal", "Cash in soles for markets"],
    },
  },
];

export const FILTER_TAGS = ["Trending", "Budget-Friendly", "Culture", "Nature & Hiking", "Foodie"] as const;
