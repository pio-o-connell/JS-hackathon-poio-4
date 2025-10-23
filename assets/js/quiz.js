/**
 * Geographic Quiz Game - Core Engine
 * Handles data fetching, question generation, difficulty levels, and scoring
 */

// REST Countries configuration
const REST_COUNTRIES_API_URL = 'https://restcountries.com/v3.1/all?fields=name,population,capital,cca3,region,languages,currencies,timezones,area,flags';
const REST_COUNTRIES_SAMPLE_SIZE = 10;

//Export this class
 class QuizEngine { 
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

  populateCountryPool() {
    if (!Array.isArray(this.countries) || this.countries.length === 0) {
      this.countryPool = [];
      return;
    }

    const pool = this.shuffleArray(this.countries).slice(0, REST_COUNTRIES_SAMPLE_SIZE);
    this.countryPool = pool;
  }

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
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateQuestionSet(type, desiredCount = REST_COUNTRIES_SAMPLE_SIZE) {
    const availableCountries = this.getCountriesForType(type, desiredCount);
    if (!Array.isArray(availableCountries) || availableCountries.length === 0) {
      return [];
    }

    const selection = this.shuffleArray(availableCountries).slice(0, Math.min(desiredCount, availableCountries.length));
    const optionPool = this.uniqueByName([...availableCountries, ...this.countries]);

    const questions = selection.map(country => this.buildQuestionForType(type, country, optionPool))
      .filter(question => question !== null);

    return questions;
  }

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

  formatPopulation(value) {
    if (!Number.isFinite(value)) {
      return 'Unknown population';
    }
    return `${value.toLocaleString()} people`;
  }

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