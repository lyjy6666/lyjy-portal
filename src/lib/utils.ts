import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface WebsiteStats {
  date: string;
  homepage: number;
  search: number;
  grandmaTraining: number;
  monopoly: number;
  toolbox: number;
  homeworkSystem: number;
  fruitGame: number;
  pomodoro: number;
  tts: number;
  video: number;
  movie: number;
}

/**
 * 生成最近30天的随机网站统计数据
 */
export function generateRandomStatsData(): WebsiteStats[] {
  const data: WebsiteStats[] = [];
  const today = new Date();

  const ranges = {
    homepage: { min: 500, max: 800 },
    search: { min: 400, max: 700 },
    grandmaTraining: { min: 0, max: 300 },
    monopoly: { min: 0, max: 300 },
    toolbox: { min: 0, max: 300 },
    homeworkSystem: { min: 200, max: 400 },
    fruitGame: { min: 0, max: 300 },
    pomodoro: { min: 100, max: 350 },
    tts: { min: 80, max: 300 },
    video: { min: 50, max: 250 },
    movie: { min: 100, max: 400 }
  };

  let lastHomepage = 500 + Math.floor(Math.random() * 301);
  let lastSearch = 400 + Math.floor(Math.random() * 301);
  let lastGrandmaTraining = Math.floor(Math.random() * 301);
  let lastMonopoly = Math.floor(Math.random() * 301);
  let lastToolbox = Math.floor(Math.random() * 301);
  let lastHomeworkSystem = 200 + Math.floor(Math.random() * 201);
  let lastFruitGame = Math.floor(Math.random() * 301);
  let lastPomodoro = 100 + Math.floor(Math.random() * 251);
  let lastTts = 80 + Math.floor(Math.random() * 221);
  let lastVideo = 50 + Math.floor(Math.random() * 201);
  let lastMovie = 100 + Math.floor(Math.random() * 301);

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    const formattedDate = `${date.getMonth() + 1}-${date.getDate()}`;
    const dayOfWeek = date.getDay();

    const weeklyMultiplier = {
      homepage: [1.0, 1.05, 1.1, 1.08, 1.05, 1.2, 1.15],
      search: [0.95, 1.0, 1.05, 1.03, 1.0, 1.1, 1.05],
      grandmaTraining: [0.8, 0.9, 1.0, 0.95, 1.05, 1.2, 1.15],
      monopoly: [0.7, 0.8, 0.9, 1.0, 1.1, 1.4, 1.3],
      toolbox: [1.0, 1.05, 1.1, 1.05, 1.0, 0.9, 0.85],
      homeworkSystem: [1.1, 1.15, 1.2, 1.15, 1.1, 0.7, 0.6],
      fruitGame: [0.8, 0.9, 1.0, 1.1, 1.15, 1.3, 1.25],
      pomodoro: [1.1, 1.15, 1.2, 1.1, 1.05, 0.8, 0.75],
      tts: [0.9, 1.0, 1.1, 1.05, 1.0, 1.15, 1.1],
      video: [0.85, 0.95, 1.05, 1.0, 1.1, 1.25, 1.2],
      movie: [0.9, 1.0, 1.05, 1.1, 1.15, 1.3, 1.25]
    };

    const applyFluctuation = (
      current: number,
      service: keyof typeof ranges,
      baseChange: number = 0
    ) => {
      let newValue = current;
      let attempts = 0;

      while (newValue === current && attempts < 10) {
        let change = (Math.random() - 0.5) * 0.3;

        if (Math.random() < 0.3) {
          change = (Math.random() - 0.5) * 0.6;
        }

        newValue = current * (1 + change) * weeklyMultiplier[service][dayOfWeek] * (1 + baseChange);
        newValue = Math.max(ranges[service].min, Math.min(ranges[service].max, Math.floor(newValue)));

        attempts++;
      }

      if (newValue === current && attempts >= 10) {
        if (current < ranges[service].max) {
          newValue = current + 1;
        } else if (current > ranges[service].min) {
          newValue = current - 1;
        }
      }

      return newValue;
    };

    const baseChanges = {
      homepage: (Math.random() - 0.5) * 0.12,
      search: (Math.random() - 0.5) * 0.12,
      grandmaTraining: (Math.random() - 0.5) * 0.18,
      monopoly: (Math.random() - 0.5) * 0.18,
      toolbox: (Math.random() - 0.5) * 0.15,
      homeworkSystem: (Math.random() - 0.5) * 0.15,
      fruitGame: (Math.random() - 0.5) * 0.17,
      pomodoro: (Math.random() - 0.5) * 0.16,
      tts: (Math.random() - 0.5) * 0.16,
      video: (Math.random() - 0.5) * 0.17,
      movie: (Math.random() - 0.5) * 0.18
    };

    lastHomepage = applyFluctuation(lastHomepage, 'homepage', baseChanges.homepage);
    lastSearch = applyFluctuation(lastSearch, 'search', baseChanges.search);
    lastGrandmaTraining = applyFluctuation(lastGrandmaTraining, 'grandmaTraining', baseChanges.grandmaTraining);
    lastMonopoly = applyFluctuation(lastMonopoly, 'monopoly', baseChanges.monopoly);
    lastToolbox = applyFluctuation(lastToolbox, 'toolbox', baseChanges.toolbox);
    lastHomeworkSystem = applyFluctuation(lastHomeworkSystem, 'homeworkSystem', baseChanges.homeworkSystem);
    lastFruitGame = applyFluctuation(lastFruitGame, 'fruitGame', baseChanges.fruitGame);
    lastPomodoro = applyFluctuation(lastPomodoro, 'pomodoro', baseChanges.pomodoro);
    lastTts = applyFluctuation(lastTts, 'tts', baseChanges.tts);
    lastVideo = applyFluctuation(lastVideo, 'video', baseChanges.video);
    lastMovie = applyFluctuation(lastMovie, 'movie', baseChanges.movie);

    if (lastSearch > lastHomepage && Math.random() > 0.1) {
      const temp = lastHomepage;
      lastHomepage = lastSearch;
      lastSearch = temp;

      if (lastHomepage > ranges.homepage.max) lastHomepage = ranges.homepage.max;
      if (lastSearch < ranges.search.min) lastSearch = ranges.search.min;
    }

    data.push({
      date: formattedDate,
      homepage: lastHomepage,
      search: lastSearch,
      grandmaTraining: lastGrandmaTraining,
      monopoly: lastMonopoly,
      toolbox: lastToolbox,
      homeworkSystem: lastHomeworkSystem,
      fruitGame: lastFruitGame,
      pomodoro: lastPomodoro,
      tts: lastTts,
      video: lastVideo,
      movie: lastMovie
    });
  }

  return data;
}

