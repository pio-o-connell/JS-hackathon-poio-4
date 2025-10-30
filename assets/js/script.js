// Wait for the DOM to finish loading before running the game
// Get the button elements and add event listeners to them

/*
    script.js -- UI controller for the World Quiz

    Overview (function -> one-line):
    - cacheDomReferences: caches commonly used DOM nodes
    - setupModeButtons: attach click handlers to quiz category buttons
    - onModeButtonClick: entry when a mode button is clicked; calls runGame
    - setupCountrySelection: wire left-pane country list click handlers
    - setupAnswerControls: wire the four answer buttons
    - setupNextButton: wire the Next Question button
    - setupStartButton: wire the Start Quiz button
    - handleQuizReady: handle 'quiz:ready' event from quiz.js
    - runGame: prepare left-pane for a selected game type
    - setupLeftPaneGameArea: enable the left-pane for interaction
    - setupRightPaneGameArea: reveal/prepare right pane after country select
    - handleCountrySelection: respond to choosing a country from left pane
    - hideQuizRowsUntilStart: hide answer/feedback rows until quiz start
    - resetRightPaneBeforeQuiz: hide right-pane and reset messages
    - updateStatusMessage: helper to update status area text and color
    - capitalize: small string helper
    - getModeColor: read CSS variable for current mode color
    - restoreStartButton: re-enable start button UI
    - beginQuiz: show overlay and prepare questions
    - completeQuizLoading: hide overlay and call startQuiz
    - startQuiz: request questions from window.quiz and start the flow
    - showQuizRows: unhide answer/feedback rows
    - renderQuestion: populate question text and answer buttons
    - toggleAnswerButtons: enable/disable and optionally clear answers
    - handleAnswerSelection: process user's answer, mark correct/incorrect
    - setFeedback: write feedback text and set correct/incorrect class
    - handleNextQuestion: move to next question or restart when finished
    - finalizeQuiz: finish quiz and show summary/play-again UI
    - restartQuiz: convenience wrapper to begin a new quiz
    - resetScoresForNewQuiz / setScoreValue / getScoreValue: score helpers
    - incrementScore / incrementWrongAnswer: convenience increments

    Notes:
    - This file orchestrates DOM updates and gameState but delegates
        question generation to the global `window.quiz` (QuizEngine).
    - It uses class toggles and aria-hidden attributes to control visibility
        and accessibility. Many functions are defensive when DOM nodes are missing.
*/


//import { QuizEngine, value } from './quiz.js';

const gameState = {
    currentGameType: null,
    selectedCountryName: null,
    questions: [],
    currentQuestionIndex: 0,
    hasAnswered: false,
    totalQuestions: 0,
    isComplete: false
};

let answerButtons = [];
let nextQuestionButton = null;
let feedbackElement = null;
let rightPaneElement = null;
let startQuizButton = null;
let overlayElement = null;
let questionElement = null;
let statusMessageElement = null;

document.addEventListener("DOMContentLoaded", function () {
    cacheDomReferences();
    setupModeButtons();
    setupCountrySelection();
    setupAnswerControls();
    setupNextButton();
    setupStartButton();

    document.addEventListener('quiz:ready', handleQuizReady);
});

function cacheDomReferences() {
    rightPaneElement = document.querySelector('.right-pane');
    startQuizButton = document.getElementById('showOverlayBtn');
    overlayElement = rightPaneElement ? rightPaneElement.querySelector('.overlay') : null;
    questionElement = rightPaneElement ? rightPaneElement.querySelector('.row-1 .question-text') : null;
    feedbackElement = rightPaneElement ? rightPaneElement.querySelector('.row-4 .feedback') : null;
    statusMessageElement = document.querySelector('.message-info-disabled');
}

// cacheDomReferences
// Purpose: find and hold commonly-used DOM nodes so other functions
// can reuse them without repeated queries. Leaves variables null
// if nodes are absent (caller code checks for these cases).


function setupModeButtons() {
    const modeButtons = document.querySelectorAll('button[data-type]');
    modeButtons.forEach(button => {
        button.addEventListener('click', onModeButtonClick);
    });
}

// setupModeButtons
// Purpose: attach click listeners to the category buttons (population/currency/languages).
// These buttons trigger the main `runGame` flow via `onModeButtonClick`.


function onModeButtonClick(event) {
    const type = event.currentTarget.getAttribute('data-type');
    if (!type || type === 'submit') {
        return;
    }
    runGame(type);
}

// onModeButtonClick
// Purpose: event handler for mode buttons. Reads the `data-type` and
// calls `runGame` to set up the left pane for country selection.


function setupCountrySelection() {
    const countries = document.querySelectorAll('.item-list .country');
    countries.forEach(item => {
        item.addEventListener('click', () => handleCountrySelection(item));
    });
}

// setupCountrySelection
// Purpose: attach click listeners to each left-pane country item so that
// when a user selects a country the `handleCountrySelection` flow runs.


function setupAnswerControls() {
    answerButtons = Array.from(document.querySelectorAll('.answer-option'));
    answerButtons.forEach((button, index) => {
        button.dataset.optionIndex = index.toString();
        button.addEventListener('click', handleAnswerSelection);
    });
}

// setupAnswerControls
// Purpose: cache the four answer buttons and wire each to the shared
// `handleAnswerSelection` handler. Also stores `data-option-index` so
// answers map to the options array returned by the quiz engine.


function setupNextButton() {
    nextQuestionButton = document.getElementById('nextQuestionBtn');
    if (nextQuestionButton) {
        nextQuestionButton.addEventListener('click', handleNextQuestion);
    }
}

// setupNextButton
// Purpose: locate the Next Question button and attach the handler that
// advances the quiz or restarts at the end.


function setupStartButton() {
    if (!startQuizButton) {
        startQuizButton = document.getElementById('showOverlayBtn');
    }
    if (startQuizButton) {
        startQuizButton.addEventListener('click', beginQuiz);
    }
}

// setupStartButton
// Purpose: ensure the Start Quiz control is wired to `beginQuiz` so the
// overlay / loading flow begins when pressed.


function handleQuizReady(event) {
    const loaded = event?.detail?.loaded ?? 0;
    if (statusMessageElement) {
        statusMessageElement.textContent = loaded > 0
            ? 'Select a quiz type, then choose a country to get started.'
            : 'Unable to load country data. Refresh and try again.';
    }
}

// handleQuizReady
// Purpose: listener for the `quiz:ready` CustomEvent dispatched by quiz.js.
// It reads `event.detail.loaded` and updates the status message accordingly.


/**
 * The main game "loop", called when the script is first loaded
 * and after the user's answer has been processed
 */
function runGame(gameType) {
    if (!['population', 'currency', 'languages'].includes(gameType)) {
        alert(`Unknown game type: ${gameType}`);
        throw `Unknown game type: ${gameType}. Aborting!`;
    }

    gameState.currentGameType = gameType;
    gameState.selectedCountryName = null;
    gameState.questions = [];
    gameState.currentQuestionIndex = 0;
    gameState.hasAnswered = false;
    gameState.totalQuestions = 0;

    const countries = document.querySelectorAll('.item-list .country');
    const documentStyles = getComputedStyle(document.documentElement);
    const colorVariable = `--${gameType}-color`;
    const colorValue = (documentStyles.getPropertyValue(colorVariable) || '#000').trim();

    countries.forEach(country => {
        country.style.color = colorValue;
        country.style.borderColor = colorValue;
        country.classList.remove('selected-country');
    });

    updateStatusMessage(`${capitalize(gameType)} quiz selected. Choose a country.`, colorValue);
    resetRightPaneBeforeQuiz();
    setupLeftPaneGameArea(gameType);
}

// runGame
// Purpose: initialize UI state for a chosen game type. Validates the
// type, resets game state, styles the left-pane buttons according to the
// selected mode color, updates the status area and enables the left pane.


/**
 * enable left pane of Game area
 * Add event listeners to each button 
 */
function setupLeftPaneGameArea(gameType) {
    const leftPane = document.querySelector('.left-pane');
    if (!leftPane) {
        return;
    }

    leftPane.classList.remove('disabled');
    leftPane.classList.remove('transparent');
    leftPane.classList.add('visible');
}

// setupLeftPaneGameArea
// Purpose: visually and interactively enable the left-pane so users can
// select a country; this function mainly toggles CSS classes.


/**
 * enable right pane of Game area
 * Add event listeners to each button 
 */
function setupRightPaneGameArea(countryName, gameType) {
    if (!rightPaneElement) {
        rightPaneElement = document.querySelector('.right-pane');
    }
    if (!rightPaneElement) {
        return;
    }

    rightPaneElement.classList.remove('hidden', 'disabled', 'transparent');
    rightPaneElement.setAttribute('aria-hidden', 'false');

    const quizBody = rightPaneElement.querySelector('.quiz__body');
    if (quizBody) {
        quizBody.classList.remove('hidden');
        quizBody.setAttribute('aria-hidden', 'false');
    }

    if (!questionElement) {
        questionElement = rightPaneElement.querySelector('.row-1');
    }

    const readableMode = capitalize(gameType);
    if (questionElement) {
        questionElement.textContent = `Quiz on ${readableMode}: ${countryName} is locked in. Press Start Quiz when you are ready.`;
        questionElement.classList.remove('hidden');
        questionElement.setAttribute('aria-hidden', 'false');
    }

    hideQuizRowsUntilStart();

    if (startQuizButton) {
        startQuizButton.classList.remove('hidden');
        startQuizButton.removeAttribute('disabled');
        startQuizButton.style.visibility = 'visible';
        startQuizButton.setAttribute('aria-hidden', 'false');
        startQuizButton.textContent = 'Start Quiz';
    }

    if (feedbackElement) {
        feedbackElement.textContent = '';
        feedbackElement.classList.remove('feedback--correct', 'feedback--incorrect');
    }
}

// setupRightPaneGameArea
// Purpose: reveal the right pane and write an instructional message that
// confirms which country and game type the quiz will use. Keeps answer rows
// hidden until the user presses Start Quiz.


function handleCountrySelection(item) {
    if (!item) {
        return;
    }

    if (!gameState.currentGameType) {
        updateStatusMessage('Select a quiz type first to unlock the countries.', '#d9534f');
        return;
    }

    const name = item.textContent ? item.textContent.trim() : '';
    if (!name || name.toLowerCase().includes('waiting')) {
        updateStatusMessage('Country data is still loading. Please try again in a moment.', '#d9534f');
        return;
    }

    document.querySelectorAll('.item-list .country.selected-country')
        .forEach(el => el.classList.remove('selected-country'));

    item.classList.add('selected-country');

    gameState.selectedCountryName = name;
    gameState.questions = [];
    gameState.currentQuestionIndex = 0;
    gameState.hasAnswered = false;
    gameState.totalQuestions = 0;
    gameState.isComplete = false;

    const color = getModeColor(gameState.currentGameType);
    updateStatusMessage(`You selected ${name}. Click "Start Quiz" to begin the ${gameState.currentGameType} challenge.`, color);

    setupRightPaneGameArea(name, gameState.currentGameType);
}

// handleCountrySelection
// Purpose: process a click on a left-pane country item. Validates that
// a quiz type is selected and that the item contains valid country text,
// then marks it selected and prepares the right pane for the quiz.


function hideQuizRowsUntilStart() {
    if (!rightPaneElement) {
        return;
    }

    const rowsToHide = rightPaneElement.querySelectorAll('.row-2, .row-3, .row-4');
    rowsToHide.forEach(row => {
        row.classList.add('hidden');
        row.setAttribute('aria-hidden', 'true');
    });

    toggleAnswerButtons(true, true);

    if (nextQuestionButton) {
        nextQuestionButton.classList.add('hidden');
        nextQuestionButton.disabled = true;
        nextQuestionButton.setAttribute('aria-hidden', 'true');
    }

    if (feedbackElement) {
        feedbackElement.textContent = '';
    }
}

// hideQuizRowsUntilStart
// Purpose: hide answer rows (row-2/row-3) and feedback (row-4) until the
// quiz begins. Also disables answer buttons and hides the Next button.


function resetRightPaneBeforeQuiz() {
    if (!rightPaneElement) {
        rightPaneElement = document.querySelector('.right-pane');
    }
    if (!rightPaneElement) {
        return;
    }

    rightPaneElement.classList.add('hidden');
    rightPaneElement.setAttribute('aria-hidden', 'true');

    if (questionElement) {
        questionElement.textContent = 'Select a country to get started.';
    }

    hideQuizRowsUntilStart();

    if (startQuizButton) {
        startQuizButton.classList.add('hidden');
        startQuizButton.setAttribute('aria-hidden', 'true');
    }
}

// resetRightPaneBeforeQuiz
// Purpose: fully reset the right pane to its initial state (hidden,
// default question text, no start button visible). Used when switching
// categories or preparing a fresh selection.


function updateStatusMessage(message, color) {
    if (!statusMessageElement) {
        statusMessageElement = document.querySelector('.message-info-disabled');
    }
    if (!statusMessageElement) {
        return;
    }

    statusMessageElement.textContent = message;
    if (color) {
        statusMessageElement.style.color = color.trim();
    }
}

// updateStatusMessage
// Purpose: helper used throughout the file to show short messages to the
// user in the status bar. Accepts an optional color string to tint the text.


function capitalize(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// capitalize
// Purpose: small utility to capitalize the first letter of a string.


function getModeColor(mode) {
    if (!mode) {
        return '#000';
    }
    const styles = getComputedStyle(document.documentElement);
    const value = styles.getPropertyValue(`--${mode}-color`);
    return value ? value.trim() : '#000';
}

// getModeColor
// Purpose: read a CSS custom property on :root for the given mode
// (e.g., --population-color) and return a usable hex/string value.


function restoreStartButton() {
    if (!startQuizButton) {
        startQuizButton = document.getElementById('showOverlayBtn');
    }
    if (startQuizButton) {
        startQuizButton.classList.remove('hidden');
        startQuizButton.removeAttribute('disabled');
        startQuizButton.setAttribute('aria-hidden', 'false');
        startQuizButton.style.visibility = 'visible';
        startQuizButton.textContent = 'Start Quiz';
    }
}

// restoreStartButton
// Purpose: show and enable the Start Quiz button (used when an error
// condition leaves the UI disabled and the user should be able to retry).


/**
 * Begin the quiz: show overlay immediately, then hide after a delay
 */
function beginQuiz(event) {
    if (event) {
        event.preventDefault();
    }

    if (!gameState.currentGameType) {
        updateStatusMessage('Select a quiz type first.', '#d9534f');
        return;
    }

    if (!gameState.selectedCountryName) {
        updateStatusMessage('Choose a country from the left pane before starting.', '#d9534f');
        return;
    }

    const quizEngine = window.quiz;
    if (!quizEngine || !Array.isArray(quizEngine.countryPool) || quizEngine.countryPool.length === 0) {
        updateStatusMessage('Still gathering country data. Please try again in a moment.', '#d9534f');
        return;
    }

    if (!overlayElement && rightPaneElement) {
        overlayElement = rightPaneElement.querySelector('.overlay');
    }

    if (startQuizButton) {
        startQuizButton.setAttribute('disabled', 'true');
    }

    if (overlayElement) {
        overlayElement.classList.add('show');
        const msg = overlayElement.querySelector('.overlay-text');
        if (msg) {
            msg.textContent = 'Preparing questions...';
        }
    }

    toggleAnswerButtons(true, true);
    hideQuizRowsUntilStart();

    setTimeout(() => completeQuizLoading(), 500);
}

// beginQuiz
// Purpose: validate prerequisites (mode selected, country chosen, quiz data ready),
// show a short overlay, disable the UI and then call `completeQuizLoading` to
// continue; acts as the user-initiated kickoff for question generation.


/**
 * Hide the overlay and reveal rows 2-4 in the right pane
 */
function completeQuizLoading() {
    if (!rightPaneElement) {
        rightPaneElement = document.querySelector('.right-pane');
    }
    if (!rightPaneElement) {
        return;
    }

    if (!overlayElement) {
        overlayElement = rightPaneElement.querySelector('.overlay');
    }

    if (overlayElement) {
        overlayElement.classList.remove('show');
    }

    startQuiz();
}

// completeQuizLoading
// Purpose: hide the overlay used during 'loading' and delegate to `startQuiz`.


function startQuiz() {
    if (!gameState.currentGameType) {
        updateStatusMessage('Select a quiz type first.', '#d9534f');
        restoreStartButton();
        return;
    }

    const quizEngine = window.quiz;
    if (!quizEngine || typeof quizEngine.generateQuestionSet !== 'function') {
        updateStatusMessage('Quiz engine is still preparing data. Please wait.', '#d9534f');
        restoreStartButton();
        return;
    }

    let questions = [];
    try {
        questions = quizEngine.generateQuestionSet(gameState.currentGameType, 10);
    } catch (error) {
        console.error('Failed to generate questions', error);
        updateStatusMessage('Unable to create questions right now. Please try again.', '#d9534f');
        restoreStartButton();
        return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        updateStatusMessage('Not enough data to start this quiz. Try another category.', '#d9534f');
        restoreStartButton();
        return;
    }

    gameState.questions = questions;
    gameState.totalQuestions = questions.length;
    gameState.currentQuestionIndex = 0;
    gameState.hasAnswered = false;
    gameState.isComplete = false;

    resetScoresForNewQuiz();
    showQuizRows();
    toggleAnswerButtons(false, true);

    if (startQuizButton) {
        startQuizButton.classList.add('hidden');
        startQuizButton.setAttribute('aria-hidden', 'true');
    }

    const statusColor = getModeColor(gameState.currentGameType);
    updateStatusMessage('Answer the quiz questions displayed on the right pane.', statusColor);

    renderQuestion();
}

// startQuiz
// Purpose: ask the QuizEngine (`window.quiz`) for a generated question set
// and initialize local `gameState` with those questions; show the UI rows
// and render the first question. Handles engine-errors gracefully.


function showQuizRows() {
    if (!rightPaneElement) {
        return;
    }

    const rowsToShow = rightPaneElement.querySelectorAll('.row-2, .row-3, .row-4');
    rowsToShow.forEach(row => {
        row.classList.remove('hidden');
        row.setAttribute('aria-hidden', 'false');
    });
}

// showQuizRows
// Purpose: reveal the answer and feedback rows after the quiz has started.


function renderQuestion() {
    const questionData = gameState.questions[gameState.currentQuestionIndex];
    if (!questionData) {
        finalizeQuiz();
        return;
    }

    const questionNumber = gameState.currentQuestionIndex + 1;
    if (questionElement) {
        questionElement.textContent = `Question ${questionNumber} of ${gameState.totalQuestions}: ${questionData.question}`;
    }

    answerButtons.forEach((button, index) => {
        const option = questionData.options[index];
        if (option) {
            button.textContent = option.label;
            button.dataset.optionIndex = index.toString();
            button.classList.remove('hidden', 'correct', 'incorrect', 'selected');
            button.disabled = false;
        } else {
            button.textContent = '';
            button.classList.add('hidden');
            button.disabled = true;
        }
    });

    if (feedbackElement) {
        feedbackElement.textContent = '';
        feedbackElement.classList.remove('feedback--correct', 'feedback--incorrect');
    }

    if (nextQuestionButton) {
        nextQuestionButton.classList.add('hidden');
        nextQuestionButton.disabled = true;
        nextQuestionButton.textContent = gameState.currentQuestionIndex === gameState.totalQuestions - 1
            ? 'Finish Quiz'
            : 'Next Question';
        nextQuestionButton.setAttribute('aria-hidden', 'true');
    }

    gameState.hasAnswered = false;
}

// renderQuestion
// Purpose: populate the question text and answer buttons for the current
// `gameState.currentQuestionIndex`. Ensures unused buttons are hidden/disabled.


function toggleAnswerButtons(disable, clearText) {
    answerButtons.forEach(button => {
        button.disabled = disable;
        button.classList.remove('correct', 'incorrect', 'selected');
        if (clearText) {
            button.textContent = '';
        }
    });
}

function handleAnswerSelection(event) {
    if (gameState.isComplete) {
        return;
    }

    const button = event.currentTarget;
    const selectedIndex = Number(button.dataset.optionIndex);
    const questionData = gameState.questions[gameState.currentQuestionIndex];

    if (!questionData || Number.isNaN(selectedIndex) || gameState.hasAnswered) {
        return;
    }

    const isCorrect = selectedIndex === questionData.correctIndex;
    gameState.hasAnswered = true;

    toggleAnswerButtons(true, false);
    button.classList.add('selected');

    const correctButton = answerButtons[questionData.correctIndex];
    if (correctButton) {
        correctButton.classList.add('correct');
    }
    if (!isCorrect) {
        button.classList.add('incorrect');
    }

    if (isCorrect) {
        incrementScore();
        setFeedback(questionData.explanation || 'Great job!', true);
    } else {
        incrementWrongAnswer();
        const correctLabel = questionData.options[questionData.correctIndex]?.label || questionData.correctAnswerLabel;
        setFeedback(`Not quite. The correct answer is ${correctLabel}.`, false);
    }

    if (nextQuestionButton) {
        nextQuestionButton.classList.remove('hidden');
        nextQuestionButton.disabled = false;
        if (gameState.currentQuestionIndex === gameState.totalQuestions - 1) {
            nextQuestionButton.textContent = 'Finish Quiz';
        }
        nextQuestionButton.setAttribute('aria-hidden', 'false');
    }
}

function setFeedback(message, status) {
    if (!feedbackElement) {
        return;
    }
    feedbackElement.textContent = message;
    feedbackElement.classList.remove('feedback--correct', 'feedback--incorrect');
    if (status === true) {
        feedbackElement.classList.add('feedback--correct');
    } else if (status === false) {
        feedbackElement.classList.add('feedback--incorrect');
    }
}

function handleNextQuestion() {
    if (gameState.isComplete) {
        restartQuiz();
        return;
    }

    if (!gameState.hasAnswered) {
        setFeedback('Pick an answer before moving on.', null);
        return;
    }

    gameState.currentQuestionIndex += 1;

    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        finalizeQuiz();
        return;
    }

    toggleAnswerButtons(false, false);
    renderQuestion();
}

function finalizeQuiz() {
    gameState.isComplete = true;
    toggleAnswerButtons(true, false);

    const correctAnswers = getScoreValue('score');
    const totalAsked = gameState.totalQuestions;
    const summary = `Quiz complete! You answered ${correctAnswers} out of ${totalAsked} correctly.`;
    setFeedback(summary, true);

    if (nextQuestionButton) {
        nextQuestionButton.classList.remove('hidden');
        nextQuestionButton.disabled = false;
        nextQuestionButton.textContent = 'Restart Quiz';
        nextQuestionButton.setAttribute('aria-hidden', 'false');
    }

    if (startQuizButton) {
        // Change Start button into a Play Again control that reloads
        // a fresh set of countries for the left pane.
        startQuizButton.classList.remove('hidden');
        startQuizButton.removeAttribute('disabled');
        startQuizButton.textContent = 'Play Again';
        startQuizButton.setAttribute('aria-hidden', 'false');
        // swap its click handler to perform a full reload of the country pool
        try {
            startQuizButton.removeEventListener('click', beginQuiz);
        } catch (e) {
            /* ignore if not attached */
        }
        // ensure we don't double-bind
        startQuizButton.removeEventListener('click', handlePlayAgain);
        startQuizButton.addEventListener('click', handlePlayAgain);
    }

    const statusColor = getModeColor(gameState.currentGameType);
    updateStatusMessage('Quiz complete! Pick a new category or play again to improve your score.', statusColor);
}

function restartQuiz() {
    gameState.isComplete = false;
    beginQuiz();
}

// handlePlayAgain
// Purpose: invoked when the user clicks 'Play Again' after finishing a quiz.
// Action: repopulate the left-pane with a fresh set of countries, clear any
// selected country, reset the right pane to initial state, and restore the
// Start Quiz button to its normal behavior.
function handlePlayAgain(event) {
    if (event) event.preventDefault();

    const quizEngine = window.quiz;
    if (quizEngine && typeof quizEngine.populateCountryPool === 'function') {
        // create a new random pool and update the left-pane DOM
        try {
            quizEngine.populateCountryPool();
            quizEngine.updateLeftPaneCountryList();
        } catch (e) {
            console.warn('Play Again: failed to repopulate country pool', e);
        }
    }

    // clear any selected country highlights
    document.querySelectorAll('.item-list .country.selected-country')
        .forEach(el => el.classList.remove('selected-country'));

    // clear game selection and reset right pane UI
    gameState.selectedCountryName = null;
    resetRightPaneBeforeQuiz();

    // enable left pane so user can pick a new country for the same mode
    if (gameState.currentGameType) {
        setupLeftPaneGameArea(gameState.currentGameType);
        updateStatusMessage(`New countries loaded. Choose a country for ${capitalize(gameState.currentGameType)}.`, getModeColor(gameState.currentGameType));
    } else {
        updateStatusMessage('New countries loaded. Select a quiz type and choose a country.');
    }

    // restore Start Quiz behavior on the button and hide it until a country is chosen
    if (startQuizButton) {
        try {
            startQuizButton.removeEventListener('click', handlePlayAgain);
        } catch (e) {}
        // make sure the regular beginQuiz is wired
        startQuizButton.removeEventListener('click', beginQuiz);
        startQuizButton.addEventListener('click', beginQuiz);
        startQuizButton.textContent = 'Start Quiz';
        startQuizButton.classList.add('hidden');
        startQuizButton.setAttribute('aria-hidden', 'true');
    }
}

function resetScoresForNewQuiz() {
    setScoreValue('score', 0);
    setScoreValue('incorrect', 0);
}

function setScoreValue(elementId, value) {
    const el = document.getElementById(elementId);
    if (!el) {
        return;
    }
    el.textContent = String(value);
}

function getScoreValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
        return 0;
    }
    const parsed = parseInt(el.textContent, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}


/**
 * Checks the answer agaist the first element in
 * the returned calculateCorrectAnswer array
 */


/*
function PrepareQuizQuestions() {
   // const quiz = new QuizEngine();
    // console.log(quiz);
    // Try to read the globally-exposed quiz instance from quiz.js
    const quizInstance = window.quiz;
    if (!quizInstance) {
        console.warn('Quiz instance not available on window.quiz yet — waiting for quiz:ready');
        document.addEventListener('quiz:ready', function onReady(e) {
            document.removeEventListener('quiz:ready', onReady);
            PrepareQuizQuestions();
        }, { once: true });
        return;
    }
    
    // Attempt to retrieve the first loaded country's population (or the selected country)
    const countries = quizInstance.countries || [];
    if (countries.length === 0) {
        console.warn('No countries loaded in quiz instance yet — waiting for quiz:ready');
        document.addEventListener('quiz:ready', function onReady(e) {
            document.removeEventListener('quiz:ready', onReady);
            PrepareQuizQuestions();
        }, { once: true });
        return;
    }
    
    // If you want the selected country, you could store that selection on the quiz instance
    // For now, log the population of the first country in the loaded list
    const first = countries[0];
    const population = first.population ?? first.popularity ?? null;
    if (population != null) {
        console.log(`Population for ${first.name}: ${population}`);
    } else {
        console.log(`Population not available for ${first.name}`);
        console.warn(`Population not available for ${first.name}`);
    }
}




/**
 * Gets the current score from the DOM and increments it by 1
 */
function incrementScore() {
    const current = getScoreValue('score');
    setScoreValue('score', current + 1);
}

/**
 * Gets the current tally of incorrect answers from the DOM and increments it by 1
 */
function incrementWrongAnswer() {
    const current = getScoreValue('incorrect');
    setScoreValue('incorrect', current + 1);
}

