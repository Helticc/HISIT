export const DEFAULT_PLAYERS: string[] = [
  "Barsaa",
  "Dalai",
  "Daby",
  "Gunsen",
  "Bilegt",
  "Javkhaa",
  "Shinee",
  "Sansaraa",
  "Zolboo",
  "Erkhmee",
  "Altangerel",
  "Odser",
  "Lundaa",
];

export interface MapInfo {
  name: string;
  icon: string;
  gradient: string;
  image: string;
}

export const MAP_POOL: MapInfo[] = [
  { 
    name: "Mirage", 
    icon: "/map-icons/de_mirage.png", 
    gradient: "from-amber-500 to-orange-700",
    image: "/images/de_mirage.png"
  },
  { 
    name: "Inferno", 
    icon: "/map-icons/de_inferno.png", 
    gradient: "from-red-600 to-orange-600",
    image: "/images/de_inferno.png"
  },
  { 
    name: "Nuke", 
    icon: "/map-icons/de_nuke.png", 
    gradient: "from-yellow-500 to-lime-700",
    image: "/images/de_nuke.png"
  },
  { 
    name: "Overpass", 
    icon: "/map-icons/de_overpass.png", 
    gradient: "from-emerald-500 to-teal-700",
    image: "/images/de_overpass.png"
  },
  { 
    name: "Ancient", 
    icon: "/map-icons/de_ancient.png", 
    gradient: "from-green-600 to-emerald-800",
    image: "/images/de_ancient.png"
  },
  { 
    name: "Anubis", 
    icon: "/map-icons/de_anubis.png", 
    gradient: "from-amber-600 to-yellow-800",
    image: "/images/de_anubis.png"
  },
  { 
    name: "Dust 2", 
    icon: "/map-icons/de_dust2.png", 
    gradient: "from-yellow-600 to-orange-800",
    image: "/images/de_dust2.png"
  },
];

export const TEAM_COLORS = {
  A: "#f97316", // orange
  B: "#3b82f6", // blue
};
