export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordPair {
  word: string;
  clues: { easy: string; medium: string; hard: string };
  category: string;
}

export const wordBank: WordPair[] = [
  // Food
  { word: "Sushi", clues: { easy: "Raw fish on rice", medium: "Japanese cuisine", hard: "Wrapped portion" }, category: "Food" },
  { word: "Pizza", clues: { easy: "Cheese and tomato pie", medium: "Italian food", hard: "Round and sliced" }, category: "Food" },
  { word: "Tacos", clues: { easy: "Tortilla with filling", medium: "Mexican dish", hard: "Folded meal" }, category: "Food" },
  { word: "Croissant", clues: { easy: "Flaky French bread", medium: "French pastry", hard: "Crescent shape" }, category: "Food" },
  { word: "Ramen", clues: { easy: "Japanese noodle soup", medium: "Asian noodle soup", hard: "Broth and strands" }, category: "Food" },
  { word: "Burrito", clues: { easy: "Big wrapped tortilla", medium: "Wrapped meal", hard: "Cylindrical bundle" }, category: "Food" },
  { word: "Waffles", clues: { easy: "Grid-patterned breakfast", medium: "Breakfast item", hard: "Pressed batter" }, category: "Food" },
  { word: "Dumpling", clues: { easy: "Stuffed dough ball", medium: "Filled dough", hard: "Sealed pocket" }, category: "Food" },
  { word: "Gelato", clues: { easy: "Italian ice cream", medium: "Frozen dessert", hard: "Dense chilled treat" }, category: "Food" },
  { word: "Pretzel", clues: { easy: "Salted knotted bread", medium: "Twisted snack", hard: "Baked loop" }, category: "Food" },

  // Places
  { word: "Eiffel Tower", clues: { easy: "Iron tower in Paris", medium: "Famous landmark", hard: "Metal framework" }, category: "Places" },
  { word: "Grand Canyon", clues: { easy: "Huge Arizona gorge", medium: "Natural wonder", hard: "Carved depth" }, category: "Places" },
  { word: "Times Square", clues: { easy: "NYC bright lights area", medium: "Busy intersection", hard: "Glowing crossroads" }, category: "Places" },
  { word: "Sahara Desert", clues: { easy: "Africa's big sand desert", medium: "Dry landscape", hard: "Endless expanse" }, category: "Places" },
  { word: "Great Wall", clues: { easy: "Long wall in China", medium: "Ancient structure", hard: "Historic barrier" }, category: "Places" },
  { word: "Amazon Rainforest", clues: { easy: "South America's jungle", medium: "Dense jungle", hard: "Green canopy" }, category: "Places" },
  { word: "Mount Everest", clues: { easy: "World's highest mountain", medium: "Tallest peak", hard: "Summit challenge" }, category: "Places" },
  { word: "Venice", clues: { easy: "Italian canal city", medium: "City on water", hard: "Floating passages" }, category: "Places" },
  { word: "Colosseum", clues: { easy: "Rome's ancient arena", medium: "Roman arena", hard: "Tiered oval" }, category: "Places" },
  { word: "Niagara Falls", clues: { easy: "Famous US-Canada waterfall", medium: "Rushing water", hard: "Thundering edge" }, category: "Places" },

  // Objects
  { word: "Guitar", clues: { easy: "Six-stringed instrument", medium: "Musical instrument", hard: "Resonant body" }, category: "Objects" },
  { word: "Telescope", clues: { easy: "Tool to see stars", medium: "Viewing device", hard: "Magnified perspective" }, category: "Objects" },
  { word: "Skateboard", clues: { easy: "Board with four wheels", medium: "Wheeled platform", hard: "Rolling plank" }, category: "Objects" },
  { word: "Chandelier", clues: { easy: "Fancy ceiling light", medium: "Hanging light", hard: "Suspended sparkle" }, category: "Objects" },
  { word: "Typewriter", clues: { easy: "Keys that print letters", medium: "Old writing machine", hard: "Mechanical clicks" }, category: "Objects" },
  { word: "Compass", clues: { easy: "Points north", medium: "Direction tool", hard: "Spinning needle" }, category: "Objects" },
  { word: "Hourglass", clues: { easy: "Sand timer", medium: "Time keeper", hard: "Flowing grains" }, category: "Objects" },
  { word: "Trampoline", clues: { easy: "Bouncy jumping mat", medium: "Bouncing surface", hard: "Spring tension" }, category: "Objects" },
  { word: "Binoculars", clues: { easy: "Two-lens viewer", medium: "Seeing far away", hard: "Paired tubes" }, category: "Objects" },
  { word: "Lava Lamp", clues: { easy: "Colorful blob lamp", medium: "Retro decoration", hard: "Warm rising forms" }, category: "Objects" },

  // Activities
  { word: "Surfing", clues: { easy: "Riding ocean waves", medium: "Ocean sport", hard: "Balancing on motion" }, category: "Activities" },
  { word: "Karaoke", clues: { easy: "Singing to a screen", medium: "Singing along", hard: "Public performance" }, category: "Activities" },
  { word: "Rock Climbing", clues: { easy: "Climbing up rock walls", medium: "Scaling heights", hard: "Grip and ascend" }, category: "Activities" },
  { word: "Yoga", clues: { easy: "Stretching and poses", medium: "Flexible exercise", hard: "Mindful positions" }, category: "Activities" },
  { word: "Scuba Diving", clues: { easy: "Swimming deep with a tank", medium: "Underwater activity", hard: "Pressurized descent" }, category: "Activities" },
  { word: "Archery", clues: { easy: "Shooting arrows at a target", medium: "Target practice", hard: "Drawn string release" }, category: "Activities" },
  { word: "Snowboarding", clues: { easy: "Riding down snowy slopes", medium: "Winter sport", hard: "Sideways descent" }, category: "Activities" },
  { word: "Pottery", clues: { easy: "Shaping clay on a wheel", medium: "Clay craft", hard: "Spinning creation" }, category: "Activities" },
  { word: "Skydiving", clues: { easy: "Jumping out of a plane", medium: "Falling from above", hard: "Terminal velocity" }, category: "Activities" },
  { word: "Fencing", clues: { easy: "Fighting with thin swords", medium: "Sword sport", hard: "Pointed exchange" }, category: "Activities" },

  // Animals
  { word: "Penguin", clues: { easy: "Black and white bird that waddles", medium: "Tuxedo bird", hard: "Flightless swimmer" }, category: "Animals" },
  { word: "Chameleon", clues: { easy: "Lizard that changes color", medium: "Color-changing creature", hard: "Adaptive skin" }, category: "Animals" },
  { word: "Octopus", clues: { easy: "Eight-armed sea animal", medium: "Many-armed sea creature", hard: "Intelligent invertebrate" }, category: "Animals" },
  { word: "Flamingo", clues: { easy: "Tall pink bird", medium: "Pink bird", hard: "One-legged stance" }, category: "Animals" },
  { word: "Platypus", clues: { easy: "Duck-billed mammal", medium: "Unusual mammal", hard: "Biological contradiction" }, category: "Animals" },
  { word: "Jellyfish", clues: { easy: "See-through ocean stinger", medium: "Floating sea life", hard: "Translucent drifter" }, category: "Animals" },
  { word: "Peacock", clues: { easy: "Bird with colorful tail fan", medium: "Showy bird", hard: "Iridescent display" }, category: "Animals" },
  { word: "Armadillo", clues: { easy: "Animal with a shell-like back", medium: "Armored animal", hard: "Banded roller" }, category: "Animals" },
  { word: "Narwhal", clues: { easy: "Whale with a long tusk", medium: "Horned sea mammal", hard: "Arctic spiral" }, category: "Animals" },
  { word: "Axolotl", clues: { easy: "Smiling Mexican salamander", medium: "Smiling amphibian", hard: "Regenerating gills" }, category: "Animals" },
];

export function getRandomWordPair(difficulty: Difficulty = 'medium'): { word: string; imposterClue: string } {
  const pair = wordBank[Math.floor(Math.random() * wordBank.length)];
  return { word: pair.word, imposterClue: pair.clues[difficulty] };
}
