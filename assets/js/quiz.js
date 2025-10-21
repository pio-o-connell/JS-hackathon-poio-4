/**
 * Geographic Quiz Game - Core Engine
 * Handles data fetching, question generation, difficulty levels, and scoring
 */

// API Configuration
const ENABLE_NINJA_API = true; // Enable direct Ninja API calls from the browser
const NINJA_API_KEY = 'yMeX7KaoDI7emt/c2uGp8w==7cVk5dAOuVFMhPIN';
const NINJA_API_BASE_URL = 'https://api.api-ninjas.com/v1';
const NINJA_RATE_DELAY_MS = 1100; // ~1 req/sec to respect free tier
const NINJA_MAX_INITIAL = 10; // smaller subset for faster first load


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

        for (const country of countryList.slice(0, NINJA_MAX_INITIAL)) {
          try {
            const data = await fetchCountryData(country);
            this.countries.push(data);
            console.log(`✅ Fetched data for ${country}`);
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

} // end class QuizEngine

   /**
   * Shuffle array (Fisher-Yates)
   */
//   shuffleArray(array) {
//     const shuffled = [...array];
//     for (let i = shuffled.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//     }
//     return shuffled;
//   }




// Create a new quiz instance
const quiz = new QuizEngine();

// Initialize the quiz (fetch data, shuffle, etc.)
quiz.init().then(() => {
  console.log('✅ Quiz initialized successfully!');
//   console.log('📊 Difficulty:', quiz.difficulty);
//   console.log('🌎 Loaded countries:', quiz.countries.length);

   // Show a preview of what got loaded
   console.log('🧩 Sample countries:', quiz.countries.slice(0, 10));

//   // Test shuffleArray directly
//   const sample = ['A', 'B', 'C', 'D', 'E'];
//   console.log('🔀 Shuffle test:', quiz.shuffleArray(sample));

//   // Confirm that quiz state looks healthy
//   console.log('📈 Score:', quiz.score, 'Wrong:', quiz.wrong, 'Streak:', quiz.streak);
}).catch(err => {
  console.error('💥 Initialization failed:', err);
});




// Export for use in quiz.js
// window.QuizEngine = QuizEngine;