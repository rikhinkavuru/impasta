export interface WordPair {
  word: string;
  imposterClue: string;
  category: string;
}

export const wordBank: WordPair[] = [
  // Food
  { word: "Sushi", imposterClue: "Japanese cuisine", category: "Food" },
  { word: "Pizza", imposterClue: "Italian food", category: "Food" },
  { word: "Tacos", imposterClue: "Mexican dish", category: "Food" },
  { word: "Croissant", imposterClue: "French pastry", category: "Food" },
  { word: "Ramen", imposterClue: "Asian noodle soup", category: "Food" },
  { word: "Burrito", imposterClue: "Wrapped meal", category: "Food" },
  { word: "Waffles", imposterClue: "Breakfast item", category: "Food" },
  { word: "Dumpling", imposterClue: "Filled dough", category: "Food" },
  { word: "Gelato", imposterClue: "Frozen dessert", category: "Food" },
  { word: "Pretzel", imposterClue: "Twisted snack", category: "Food" },

  // Places
  { word: "Eiffel Tower", imposterClue: "Famous landmark", category: "Places" },
  { word: "Grand Canyon", imposterClue: "Natural wonder", category: "Places" },
  { word: "Times Square", imposterClue: "Busy intersection", category: "Places" },
  { word: "Sahara Desert", imposterClue: "Dry landscape", category: "Places" },
  { word: "Great Wall", imposterClue: "Ancient structure", category: "Places" },
  { word: "Amazon Rainforest", imposterClue: "Dense jungle", category: "Places" },
  { word: "Mount Everest", imposterClue: "Tallest peak", category: "Places" },
  { word: "Venice", imposterClue: "City on water", category: "Places" },
  { word: "Colosseum", imposterClue: "Roman arena", category: "Places" },
  { word: "Niagara Falls", imposterClue: "Rushing water", category: "Places" },

  // Objects
  { word: "Guitar", imposterClue: "Musical instrument", category: "Objects" },
  { word: "Telescope", imposterClue: "Viewing device", category: "Objects" },
  { word: "Skateboard", imposterClue: "Wheeled platform", category: "Objects" },
  { word: "Chandelier", imposterClue: "Hanging light", category: "Objects" },
  { word: "Typewriter", imposterClue: "Old writing machine", category: "Objects" },
  { word: "Compass", imposterClue: "Direction tool", category: "Objects" },
  { word: "Hourglass", imposterClue: "Time keeper", category: "Objects" },
  { word: "Trampoline", imposterClue: "Bouncing surface", category: "Objects" },
  { word: "Binoculars", imposterClue: "Seeing far away", category: "Objects" },
  { word: "Lava Lamp", imposterClue: "Retro decoration", category: "Objects" },

  // Activities
  { word: "Surfing", imposterClue: "Ocean sport", category: "Activities" },
  { word: "Karaoke", imposterClue: "Singing along", category: "Activities" },
  { word: "Rock Climbing", imposterClue: "Scaling heights", category: "Activities" },
  { word: "Yoga", imposterClue: "Flexible exercise", category: "Activities" },
  { word: "Scuba Diving", imposterClue: "Underwater activity", category: "Activities" },
  { word: "Archery", imposterClue: "Target practice", category: "Activities" },
  { word: "Snowboarding", imposterClue: "Winter sport", category: "Activities" },
  { word: "Pottery", imposterClue: "Clay craft", category: "Activities" },
  { word: "Skydiving", imposterClue: "Falling from above", category: "Activities" },
  { word: "Fencing", imposterClue: "Sword sport", category: "Activities" },

  // Animals
  { word: "Penguin", imposterClue: "Tuxedo bird", category: "Animals" },
  { word: "Chameleon", imposterClue: "Color-changing creature", category: "Animals" },
  { word: "Octopus", imposterClue: "Many-armed sea creature", category: "Animals" },
  { word: "Flamingo", imposterClue: "Pink bird", category: "Animals" },
  { word: "Platypus", imposterClue: "Unusual mammal", category: "Animals" },
  { word: "Jellyfish", imposterClue: "Floating sea life", category: "Animals" },
  { word: "Peacock", imposterClue: "Showy bird", category: "Animals" },
  { word: "Armadillo", imposterClue: "Armored animal", category: "Animals" },
  { word: "Narwhal", imposterClue: "Horned sea mammal", category: "Animals" },
  { word: "Axolotl", imposterClue: "Smiling amphibian", category: "Animals" },
];

export function getRandomWordPair(): WordPair {
  return wordBank[Math.floor(Math.random() * wordBank.length)];
}
