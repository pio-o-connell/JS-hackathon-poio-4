/**
 * Geographic Quiz Game - Core Engine
 * Handles data fetching, question generation, difficulty levels, and scoring
 */

// REST Countries configuration
const REST_COUNTRIES_API_URL = 'https://restcountries.com/v3.1/all?fields=name,population,capital,cca3,region,languages,currencies,timezones,area,flags';
const REST_COUNTRIES_SAMPLE_SIZE = 10;

//Export this class
 /**
  * QuizEngine - Core quiz logic and data handling.
  * Responsibilities:
  *  - Load and normalize country data from REST Countries
  *  - Build a small randomized country pool for the left pane
  *  - Generate question sets (population, currency, languages)
  *  - Provide helper utilities for distractor generation and formatting
  */
 class QuizEngine {
  /**
   * Construct a new QuizEngine instance with default state values.
   * No external inputs; prepares internal arrays and settings.
   */
  constructor() {
    this.countries = [];

    this.extendedData = [];
    this.currentQuestion = null;
    this.score = 0;
    this.wrong = 0;
    this.streak = 0;
    this.questionNumber = 0;
    this.totalQuestions = 10;
    this.difficulty = 'easy';
    this.answeredCurrentQuestion = false;
  this.countryPool = [];
    this.difficultySettings = {
      easy: { countries: 30, popularOnly: true },
      medium: { countries: 100, popularOnly: false },
      hard: { countries: 200, popularOnly: false }
    };
    }

   /**
   * Initialize the quiz - fetch data and prepare questions
   */

  /**
  * Initialize engine: fetch countries, build a sample pool and update UI.
  * Returns: Promise<void>
  * Side-effects: populates `this.countries`, `this.countryPool` and calls
  * `updateLeftPaneCountryList()` which updates DOM elements directly.
  */
  async init() {
    try {
      console.log('🚀 Initializing quiz...');

      await this.loadFromRestCountries();
      this.populateCountryPool();
      this.updateLeftPaneCountryList();
    } catch (err) {
      console.error('Initialization failed in QuizEngine.init():', err);
      throw err;
    }
  } // end init

  /**
   * Minimal fallback using REST Countries (stubbed)
   * Replace with a real fetch if needed.
   */
   /**
  * Fetch data from the REST Countries API
   */
  /**
   * Fetch and normalize data from the REST Countries API.
   * Populates `this.countries` with objects of shape:
   * { name, code, capital, population, area, region, languages[], currencies[], timezones[], flag, flagAlt }
   * Throws on non-OK HTTP responses.
   */
   async loadFromRestCountries() {
    const response = await fetch(REST_COUNTRIES_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    this.countries = data
      .filter(country => country?.name?.common && country.population)
      .map(country => ({
        name: country.name.common,
        code: country.cca3 || null,
        capital: Array.isArray(country.capital) && country.capital.length ? country.capital[0] : 'N/A',
        population: country.population || 0,
        area: country.area || 0,
        region: country.region || 'Unknown',
        languages: country.languages ? Object.values(country.languages) : [],
        currencies: country.currencies ? Object.values(country.currencies).map(c => c.name) : [],
        timezones: country.timezones || [],
        flag: country.flags?.png || country.flags?.svg || '',
        flagAlt: country.flags?.alt || `Flag of ${country.name.common}`,
        gdp: 0,
        popularity: country.population || 0
      }));
  }

  /**
   * Create a randomized sample (`this.countryPool`) from `this.countries`.
   * Uses `shuffleArray` and slices to `REST_COUNTRIES_SAMPLE_SIZE`.
   */
  populateCountryPool() {
    if (!Array.isArray(this.countries) || this.countries.length === 0) {
      this.countryPool = [];
      return;
    }

    const pool = this.shuffleArray(this.countries).slice(0, REST_COUNTRIES_SAMPLE_SIZE);
    this.countryPool = pool;
  }

  /**
   * Write the `this.countryPool` entries into the left-pane DOM slots.
   * Side-effects: mutates `.item-list .country` textContent and dataset.
   * If there are fewer countries than slots, surplus slots are left as 'Waiting...'.
   */
  updateLeftPaneCountryList() {
    const listItems = document.querySelectorAll('.item-list .country');
    if (!listItems.length) {
      return;
    }

    // Clear any surplus list items if there are fewer countries than list slots
    listItems.forEach(item => {
      item.textContent = 'Waiting...';
      delete item.dataset.countryCode;
    });

    this.countryPool.forEach((country, index) => {
      const listItem = listItems[index];
      if (!listItem || !country) {
        return;
      }
      listItem.textContent = country.name;
      if (country.code) {
        listItem.dataset.countryCode = country.code;
      }
    });
  }


   /**
   * Shuffle array (Fisher-Yates)
   */
  /**
   * Return a new array with elements shuffled (Fisher-Yates algorithm).
   * Input: array
   * Output: shuffled copy
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate a set of quiz questions for the provided `type`.
   * Inputs:
   *  - type: 'population' | 'currency' | 'languages'
   *  - desiredCount: number of questions (default REST_COUNTRIES_SAMPLE_SIZE)
   * Returns: Array of question objects or empty array if insufficient data.
   */
  generateQuestionSet(type, desiredCount = REST_COUNTRIES_SAMPLE_SIZE) {
    const availableCountries = this.getCountriesForType(type, desiredCount);
    if (!Array.isArray(availableCountries) || availableCountries.length === 0) {
      return [];
    }

    // Try to produce exactly `desiredCount` questions where possible.
    // Some country entries may not yield a usable question (builder returns null),
    // so iterate through a shuffled list and collect until we hit desiredCount
    // or exhaust reasonable candidates. If still short, attempt to expand
    // the pool using the full country list as a fallback.
    const shuffledAvailable = this.shuffleArray(availableCountries);
    const optionPool = this.uniqueByName([...availableCountries, ...this.countries]);

    const questions = [];
    const tried = new Set();

    for (let i = 0; i < shuffledAvailable.length && questions.length < desiredCount; i++) {
      const country = shuffledAvailable[i];
      if (!country || tried.has(country.name)) continue;
      tried.add(country.name);
      const q = this.buildQuestionForType(type, country, optionPool);
      if (q) questions.push(q);
    }

    // If we didn't reach desiredCount, try additional countries from the
    // full list (this.countries) to find more valid questions.
    if (questions.length < desiredCount) {
      const fallbackPool = this.shuffleArray(this.countries).filter(c => !tried.has(c.name));
      for (let i = 0; i < fallbackPool.length && questions.length < desiredCount; i++) {
        const country = fallbackPool[i];
        if (!this.hasDataForType(country, type)) continue;
        const q = this.buildQuestionForType(type, country, optionPool);
        if (q) {
          questions.push(q);
          tried.add(country.name);
        }
      }
    }

    return questions.slice(0, desiredCount);
  }

  /**
   * Build and return a pool of countries that have valid data for `type`.
   * Tries `this.countryPool` first then falls back to `this.countries`.
   */
  getCountriesForType(type, desiredCount) {
    const basePool = this.countryPool.length
      ? [...this.countryPool]
      : this.shuffleArray(this.countries).slice(0, Math.max(desiredCount, REST_COUNTRIES_SAMPLE_SIZE));

    const filteredBase = basePool.filter(country => this.hasDataForType(country, type));
    if (filteredBase.length > 0) {
      return this.uniqueByName(filteredBase);
    }

    const extended = this.countries.filter(country => this.hasDataForType(country, type));
    return this.uniqueByName([...filteredBase, ...extended]);
  }

  /**
   * Deduplicate countries by `name` preserving first occurrence.
   * Returns an array with unique country names.
   */
  uniqueByName(countries) {
    const seen = new Set();
    return countries.filter(country => {
      if (!country || !country.name) {
        return false;
      }
      if (seen.has(country.name)) {
        return false;
      }
      seen.add(country.name);
      return true;
    });
  }

  /**
   * Check whether a given `country` object has the necessary data
   * for the requested `type` ('population'|'currency'|'languages').
   * Returns boolean.
   */
  hasDataForType(country, type) {
    if (!country) {
      return false;
    }

    switch (type) {
      case 'population':
        return Number.isFinite(country.population) && country.population > 0;
      case 'currency':
        return Array.isArray(country.currencies) && country.currencies.length > 0 && Boolean(country.currencies[0]);
      case 'languages':
        return Array.isArray(country.languages) && country.languages.length > 0 && Boolean(country.languages[0]);
      default:
        return false;
    }
  }

  /**
   * Dispatcher: call the appropriate builder for `type` and return
   * a question object or null if construction fails.
   */
  buildQuestionForType(type, country, pool) {
    switch (type) {
      case 'population':
        return this.buildPopulationQuestion(country, pool);
      case 'currency':
        return this.buildCurrencyQuestion(country, pool);
      case 'languages':
        return this.buildLanguagesQuestion(country, pool);
      default:
        return null;
    }
  }

  /**
   * Build a population question for the supplied `country`.
   * Uses `generatePopulationOptions` to produce distractors.
   * Returns a question object { type, country, question, options[], correctIndex, correctAnswerLabel, explanation }
   * or `null` when not enough distinct options can be formed.
   */
  buildPopulationQuestion(country, pool) {
    if (!this.hasDataForType(country, 'population')) {
      return null;
    }

    const correctValue = country.population;
    const rawOptions = this.generatePopulationOptions(correctValue, pool, country.name);
    const uniqueOptions = Array.from(new Set(rawOptions)).slice(0, 4);

    if (!uniqueOptions.includes(correctValue) || uniqueOptions.length < 4) {
      return null;
    }

    const optionObjects = uniqueOptions.map(value => ({
      label: this.formatPopulation(value),
      value
    }));

    const shuffledOptions = this.shuffleArray(optionObjects);
    const correctIndex = shuffledOptions.findIndex(option => option.value === correctValue);

    if (correctIndex === -1) {
      return null;
    }

    return {
      type: 'population',
      country: country.name,
      question: `What is the population of ${country.name}?`,
      options: shuffledOptions,
      correctIndex,
      correctAnswerLabel: this.formatPopulation(correctValue),
      explanation: `${country.name} has a population of about ${this.formatPopulation(correctValue)}.`
    };
  }

  /**
   * Create an array containing `correctValue` and up to 3 numeric distractors.
   * Strategy:
   *  - prefer population values from `pool` (excluding the same country)
   *  - fall back to multiplier-based values when pool lacks candidates
   */
  generatePopulationOptions(correctValue, pool, countryName) {
    const candidates = pool
      .filter(item => item.name !== countryName && this.hasDataForType(item, 'population'))
      .map(item => item.population);

    const uniqueCandidates = Array.from(new Set(candidates));
    const distractors = [];

    while (uniqueCandidates.length > 0 && distractors.length < 3) {
      const index = Math.floor(Math.random() * uniqueCandidates.length);
      const candidate = uniqueCandidates.splice(index, 1)[0];
      if (candidate !== correctValue) {
        distractors.push(candidate);
      }
    }

    const fallbackMultipliers = [0.55, 0.75, 1.2, 1.4, 1.8];
    let multiplierIndex = 0;

    while (distractors.length < 3) {
      const multiplier = fallbackMultipliers[multiplierIndex % fallbackMultipliers.length];
      multiplierIndex += 1;
      const candidate = Math.max(100000, Math.round(correctValue * multiplier));
      if (![correctValue, ...distractors].includes(candidate)) {
        distractors.push(candidate);
      }
    }

    return [correctValue, ...distractors];
  }

  /**
   * Format a population number for display, e.g. '1,234,567 people'.
   */
  formatPopulation(value) {
    if (!Number.isFinite(value)) {
      return 'Unknown population';
    }
    return `${value.toLocaleString()} people`;
  }

  /**
   * Build a currency question for `country`. Returns question object or null.
   * Uses `generateCurrencyOptions` to assemble distractors.
   */
  buildCurrencyQuestion(country, pool) {
    if (!this.hasDataForType(country, 'currency')) {
      return null;
    }

    const correctCurrency = country.currencies[0];
    const optionLabels = this.generateCurrencyOptions(correctCurrency, pool, country.name);
    const uniqueOptions = optionLabels.filter((label, index, array) => Boolean(label) && array.indexOf(label) === index);

    if (!uniqueOptions.includes(correctCurrency) || uniqueOptions.length < 4) {
      return null;
    }

    const optionObjects = uniqueOptions.slice(0, 4).map(label => ({
      label,
      value: label
    }));

    const shuffledOptions = this.shuffleArray(optionObjects);
    const correctIndex = shuffledOptions.findIndex(option => option.value === correctCurrency);

    if (correctIndex === -1) {
      return null;
    }

    return {
      type: 'currency',
      country: country.name,
      question: `Which currency is used in ${country.name}?`,
      options: shuffledOptions,
      correctIndex,
      correctAnswerLabel: correctCurrency,
      explanation: `${country.name} uses the ${correctCurrency}.`
    };
  }

  /**
   * Produce an array of currency names: [correctCurrency, ...distractors]
   * Tries pool values first, then uses fallbackCurrencies to reach 4 items.
   */
  generateCurrencyOptions(correctCurrency, pool, countryName) {
    const candidates = this.collectUniqueValues(pool, 'currencies', countryName)
      .filter(currency => currency !== correctCurrency);

    const distractors = [];
    while (candidates.length > 0 && distractors.length < 3) {
      const index = Math.floor(Math.random() * candidates.length);
      const candidate = candidates.splice(index, 1)[0];
      if (!distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    const fallbackCurrencies = ['Euro', 'United States dollar', 'Yen', 'Pound sterling', 'Rupee'];
    for (const currency of fallbackCurrencies) {
      if (distractors.length >= 3) {
        break;
      }
      if (currency !== correctCurrency && !distractors.includes(currency)) {
        distractors.push(currency);
      }
    }

    return [correctCurrency, ...distractors].slice(0, 4);
  }

  /**
   * Build a languages question for `country`. Returns question object or null.
   */
  buildLanguagesQuestion(country, pool) {
    if (!this.hasDataForType(country, 'languages')) {
      return null;
    }

    const correctLanguage = country.languages[0];
    const optionLabels = this.generateLanguageOptions(correctLanguage, pool, country.name);
    const uniqueOptions = optionLabels.filter((label, index, array) => Boolean(label) && array.indexOf(label) === index);

    if (!uniqueOptions.includes(correctLanguage) || uniqueOptions.length < 4) {
      return null;
    }

    const optionObjects = uniqueOptions.slice(0, 4).map(label => ({
      label,
      value: label
    }));

    const shuffledOptions = this.shuffleArray(optionObjects);
    const correctIndex = shuffledOptions.findIndex(option => option.value === correctLanguage);

    if (correctIndex === -1) {
      return null;
    }

    return {
      type: 'languages',
      country: country.name,
      question: `Which language is spoken in ${country.name}?`,
      options: shuffledOptions,
      correctIndex,
      correctAnswerLabel: correctLanguage,
      explanation: `${correctLanguage} is spoken in ${country.name}.`
    };
  }

  /**
   * Produce an array of language names including correctLanguage and
   * up to 3 distractors sourced from pool then fallbackLanguages.
   */
  generateLanguageOptions(correctLanguage, pool, countryName) {
    const candidates = this.collectUniqueValues(pool, 'languages', countryName)
      .filter(language => language !== correctLanguage);

    const distractors = [];
    while (candidates.length > 0 && distractors.length < 3) {
      const index = Math.floor(Math.random() * candidates.length);
      const candidate = candidates.splice(index, 1)[0];
      if (!distractors.includes(candidate)) {
        distractors.push(candidate);
      }
    }

    const fallbackLanguages = ['English', 'Spanish', 'French', 'Arabic', 'Hindi', 'Portuguese', 'Russian', 'Chinese'];
    for (const language of fallbackLanguages) {
      if (distractors.length >= 3) {
        break;
      }
      if (language !== correctLanguage && !distractors.includes(language)) {
        distractors.push(language);
      }
    }

    return [correctLanguage, ...distractors].slice(0, 4);
  }

  /**
   * Helper to collect unique scalar values (e.g., currencies or languages)
   * from a pool of country objects while excluding a given country name.
   * Returns an array of unique values in first-seen order.
   */
  collectUniqueValues(pool, key, excludeCountryName) {
    const seen = new Set();
    const values = [];

    pool.forEach(country => {
      if (!country || country.name === excludeCountryName) {
        return;
      }

      const items = Array.isArray(country[key]) ? country[key] : [];
      items.forEach(item => {
        if (!item || seen.has(item)) {
          return;
        }
        seen.add(item);
        values.push(item);
      });
    });

    return values;
  }

 } // end class QuizEngine



// Create a new quiz instance
const quiz = new QuizEngine();
// Expose the instance globally so other classic scripts can access it
window.quiz = quiz;

// Initialize the quiz (fetch data, shuffle, etc.)
quiz.init().then(() => {
  console.log('✅ Quiz initialized successfully!');
//   console.log('📊 Difficulty:', quiz.difficulty);
//   console.log('🌎 Loaded countries:', quiz.countries.length);

   // Show a preview of what got loaded
   console.log('🧩 Sample countries:', quiz.countries.slice(0, 10));

   document.dispatchEvent(new CustomEvent('quiz:ready', {
     detail: { loaded: quiz.countries ? quiz.countries.length : 0 }
   }));

//    const listItems = document.querySelectorAll('.item-list .country');

//    listItems.forEach((item, index) => {
//      if (quiz.countries[index] && quiz.countries[index].name) {
//        item.textContent = quiz.countries[index].name;
//      } else {
//        item.textContent = 'Unknown';
//      }
//    });

//   // Test shuffleArray directly
//   const sample = ['A', 'B', 'C', 'D', 'E'];
//   console.log('🔀 Shuffle test:', quiz.shuffleArray(sample));

//   // Confirm that quiz state looks healthy
//   console.log('📈 Score:', quiz.score, 'Wrong:', quiz.wrong, 'Streak:', quiz.streak);
}).catch(err => {
  console.error('💥 Initialization failed:', err);
});

// Optionally generate initial questions (safe to call; will use loaded countries)

// function blockDelay(ms) {
//   const start = Date.now();
//   while (Date.now() - start < ms) {
//     // do nothing, just wait
//   }
// }

//  blockDelay(5000); // blocks for 5 seconds

// try {
//   if (typeof quiz.generateQuestionsandAnswers === 'function') {
//     quiz.generateQuestionsandAnswers();
//   }
// } catch (e) {
//   console.warn('Could not generate initial questions immediately:', e);
// }



// Export for use in quiz.js
 window.QuizEngine = QuizEngine;
 window.myvalue=42;


// export const value = 42;