/**
 * Geographic Quiz Game - Core Engine
 * Handles data fetching, question generation, difficulty levels, and scoring
 */

// API Configuration
const ENABLE_NINJA_API = true; // Enable direct Ninja API calls from the browser
const NINJA_API_KEY = 'yMeX7KaoDI7emt/c2uGp8w==7cVk5dAOuVFMhPIN';
const NINJA_API_BASE_URL = 'https://api.api-ninjas.com/v1';
const NINJA_RATE_DELAY_MS = 200; // ~1 req/sec to respect free tier
const NINJA_MAX_INITIAL = 10; // smaller subset for faster first load

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
    this.apiKey = NINJA_API_KEY;
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

      // If Ninja API is disabled or no key, use REST Countries directly
      if (!ENABLE_NINJA_API || !this.apiKey) {
        await this.loadFromRestCountries();
      } else {
        // List of countries to fetch from Ninja API (we will pick a safe subset)
        const countryList = [
        'United States', 'China', 'India', 'Brazil', 'Russia', 'Japan', 'Germany', 'United Kingdom',
        'France', 'Italy', 'Canada', 'South Korea', 'Spain', 'Australia', 'Mexico', 'Indonesia',
        'Netherlands', 'Saudi Arabia', 'Turkey', 'Switzerland', 'Poland', 'Belgium', 'Sweden',
        'Argentina', 'Norway', 'Austria', 'United Arab Emirates', 'Ireland', 'Israel', 'Singapore',
        'Denmark', 'South Africa', 'Egypt', 'Philippines', 'Pakistan', 'Vietnam', 'Bangladesh',
        'Chile', 'Colombia', 'Finland', 'Portugal', 'Greece', 'New Zealand', 'Peru', 'Czech Republic',
        'Romania', 'Iraq', 'Qatar', 'Kazakhstan', 'Hungary', 'Kuwait', 'Morocco', 'Ukraine',
        'Ethiopia', 'Kenya', 'Ecuador', 'Guatemala', 'Tanzania', 'Panama', 'Croatia',
        'Lithuania', 'Slovenia', 'Serbia', 'Ghana', 'Tunisia', 'Bolivia', 'Paraguay',
        'Uganda', 'Latvia', 'Estonia', 'Nepal', 'Iceland', 'Cambodia', 'Cyprus', 'Zimbabwe',
        'Zambia', 'Albania', 'Mozambique', 'Jamaica', 'Malta', 'Mongolia', 'Armenia', 'Nicaragua'
        ];
        
        this.countries = [];
        // TODO: fetch subset from API here using countryList and rate limit
        // Fetch subset from API here using countryList and rate limit
        const fetchCountryData = async (country) => {
          const url = `${NINJA_API_BASE_URL}/country?name=${encodeURIComponent(country)}`;
          const response = await fetch(url, {
            headers: {
              'X-Api-Key': this.apiKey
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${country}: ${response.statusText}`);
          }

          return response.json();
        };

        // Shuffle the country list before slicing
        const shuffledCountryList = this.shuffleArray(countryList);
        for (const [index, country] of shuffledCountryList.slice(0, NINJA_MAX_INITIAL).entries()) {
          try {
            const data = await fetchCountryData(country);
            this.countries.push(data);
            console.log(`✅ Fetched data for ${country}`);

            // Update the corresponding list item as data is fetched
            const listItem = document.querySelector(`.item-list .country:nth-child(${index + 1})`);
            if (listItem) {
              listItem.textContent = `${country}` || 'Unknown';
            }

            await new Promise(resolve => setTimeout(resolve, NINJA_RATE_DELAY_MS)); // Rate limiting
          } catch (err) {
            console.error(`❌ Error fetching data for ${country}:`, err);
          }
        }
      } // end else (ENABLE_NINJA_API)
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
   * Fallback to REST Countries API if Ninja API fails
   */
  async loadFromRestCountries() {
    const response = await fetch('https://restcountries.com/v3.1/all');
    if (!response.ok) throw new Error('Failed to fetch countries');
    
    const data = await response.json();
    
    this.countries = data.map(country => ({
      name: country.name.common,
      capital: country.capital ? country.capital[0] : 'N/A',
      population: country.population || 0,
      area: country.area || 0,
      region: country.region || 'Unknown',
      languages: country.languages ? Object.values(country.languages) : [],
      currencies: country.currencies ? Object.values(country.currencies).map(c => c.name) : [],
      timezones: country.timezones || [],
      flag: country.flags?.png || country.flags?.svg || '',
      flagAlt: country.flags?.alt || `Flag of ${country.name.common}`,
      gdp: 0, // Not available in REST Countries
      popularity: country.population || 0
    })).filter(c => c.population > 0);
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

  /**
   *Change the text on buttons in left-pane
   */
  updateButtonLabels() {
    const list = document.querySelectorAll('item-list');
    list.forEach((item, index) => {
      item.textContent = `Option ${index + 1}`;
    });
  }

  /**
   * Create the a multiple choice question
   */
// /-- generateQuestionsandAnswers(){                                                                  ----
//  /()   for (i=0;i< NINJA_MAX_INITIAL;i++){
      // generateMultipleChoiceQuestion('population', this.countries);

    // }
  // }
   /**
   * Generate a multiple choice question
  //  */
 /* generateMultipleChoiceQuestion(type, pool) {/*
    const country = pool[Math.floor(Math.random() * pool.length)];
    let question, correctAnswer, options, explanation, media;

    switch (type) {
      case 'population':
        question = `What is the approximate population of ${country.name}?`;
        correctAnswer = this.formatPopulation(country.population);
        options = this.generatePopulationOptions(country.population, pool);
        explanation = `${country.name} has a population of approximately ${correctAnswer}.`;
        break;

      // case 'area':
      //   question = `What is the total land area of ${country.name} in square kilometers?`;
      //   correctAnswer = this.formatArea(country.area);
      //   options = this.generateAreaOptions(country.area, pool);
      //   explanation = `${country.name} has a total area of ${correctAnswer}.`;
      //   break;

      // case 'gdp':
        question = `What is the approximate GDP of ${country.name}?`;
        correctAnswer = this.formatGDP(country.population * 15000); // Rough estimate based on population
        options = this.generateGDPOptions(country.population * 15000, pool);
        explanation = `${country.name} has an estimated GDP of approximately ${correctAnswer}.`;
        break;

      // case 'capital':
      //   question = `What is the capital city of ${country.name}?`;
      //   correctAnswer = country.capital;
      //   options = this.generateCapitalOptions(country, pool);
      //   explanation = `The capital of ${country.name} is ${correctAnswer}.`;
      //   break;

      case 'currency':
        question = `What currency is used in ${country.name}?`;
        correctAnswer = country.currencies[0] || 'Unknown';
        options = this.generateCurrencyOptions(country, pool);
        explanation = `${country.name} uses ${correctAnswer}.`;
        break;

      case 'languages':
        question = `Which languages are spoken in ${country.name}?`;
        correctAnswer = country.languages[0] || 'Unknown';
        options = this.generateLanguageOptions(country, pool);
        explanation = `${correctAnswer} is one of the official languages spoken in ${country.name}.`;
        break;

    //   case 'timezone':
    //     question = `What is the time zone of ${country.name}?`;
    //     correctAnswer = country.timezones[0];
    //     options = this.generateTimezoneOptions(country, pool);
    //     explanation = `The time zone of ${country.name} is ${correctAnswer}.`;
    //     break;

    //   case 'flag':
    //     question = `What does the flag of ${country.name} look like?`;
    //     correctAnswer = country.flag;
    //     options = this.generateFlagOptions(country, pool);
    //     explanation = `This is what the flag of ${country.name} looks like.`;
    //     media = { type: 'flags', options: options };
    //     break;
  /*   } 

    return {
      type,
      question,
      correctAnswer,
      options: this.shuffleArray(options),
      explanation,
      media,
      country: country.name
    };
  }

  generateCurrencyOptions(country, pool) {
    const options = [country.currencies[0]];
    const otherCurrencies = pool
      .filter(c => c.name !== country.name && c.currencies.length > 0)
      .flatMap(c => c.currencies);

    while (options.length < 4 && otherCurrencies.length > 0) {
      const idx = Math.floor(Math.random() * otherCurrencies.length);
      const currency = otherCurrencies.splice(idx, 1)[0];
      if (!options.includes(currency)) {
        options.push(currency);
      }
    }
return options;
  }

   /**
   * Generate distractor options for population questions
   */
 /* generatePopulationOptions(correctPop, pool) {
    const options = [this.formatPopulation(correctPop)];
    const multipliers = this.difficulty === 'easy' ? [0.5, 2, 5] : 
                        this.difficulty === 'medium' ? [0.7, 1.5, 3] : 
                        [0.85, 1.15, 1.4];

    multipliers.forEach(mult => {
      options.push(this.formatPopulation(Math.floor(correctPop * mult)));
    });

    return options;
  } */



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

// Notify other scripts that the quiz has finished initializing (include how many countries were loaded)
try {
  document.dispatchEvent(new CustomEvent('quiz:ready', { detail: { loaded: quiz.countries ? quiz.countries.length : 0 } }));
} catch (e) {
  // If dispatching fails for any reason, ignore — other scripts should still check window.quiz
}

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