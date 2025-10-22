// Wait for the DOM to finish loading before running the game
// Get the button elements and add event listeners to them


//import { QuizEngine, value } from './quiz.js';

document.addEventListener("DOMContentLoaded", function () {
    // Only attach global listeners to mode buttons with data-type
    const modeButtons = document.querySelectorAll('button[data-type]');
    for (let button of modeButtons) {
        button.addEventListener("click", function () {
            const type = this.getAttribute("data-type");
            if (type === "submit") {
                checkAnswer();
            } else if (type) {
                runGame(type);
            }
        });
    }

    // document.getElementById("answer-box").addEventListener("keydown", function(event) {
    //     if (event.key === "Enter") {
    //         checkAnswer();
    //     }
    // });


    // runGame("addition");

});

/**
 * The main game "loop", called when the script is first loaded
 * and after the user's answer has been processed
 */
function runGame(gameType) {
    const countries = document.querySelectorAll('.item-list .country');
    const message = document.querySelector('.message-info-disabled');

    for (let country of countries) {
        switch (gameType) {
            case "population":
                country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--population-color');
                message.textContent = "Population quiz selected. Choose a country.";
                message.style.color = getComputedStyle(document.documentElement).getPropertyValue('--population-color');

                break;
            case "currency":
                country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--currency-color');
                message.textContent = "Currency quiz selected. Choose a country.";
                message.style.color = getComputedStyle(document.documentElement).getPropertyValue('--currency-color');
                break;
            case "languages":
                country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--languages-color');
                message.textContent = "Languages quiz selected. Choose a country.";
                message.style.color = getComputedStyle(document.documentElement).getPropertyValue('--languages-color');
                break;
            default:
                alert(`Unknown game type: ${gameType}`);
                throw `Unknown game type: ${gameType}. Aborting!`;
        }
    }
    setupLeftPaneGameArea(gameType);
}

/**
 * enable left pane of Game area
 * Add event listeners to each button 
 */
function setupLeftPaneGameArea(gameType) {
    const leftPane = document.getElementsByClassName('left-pane');

    const countries = document.querySelectorAll('.item-list .country');


    leftPane[0].classList.remove('disabled');  // enable left pane
    leftPane[0].classList.add('visible');

    // build event listeners
    for (let country of countries) {
        country.addEventListener("click", function () {
            // Handle country selection
            //  alert(`You selected ${this.textContent} for game type: ${gameType}`);
            console.log(`You selected ${this.textContent} for game type: ${gameType}`);
            document.querySelector('.message-info-disabled').textContent = `You selected ${this.textContent} for for game type: ${gameType}. Preparing quiz...`;
            setupRightPaneGameArea(country.textContent, gameType);
            //   document.documentElement.style.setProperty('--languages-color', this.textContent);
        });
    }

    // Close the message and show the quiz

};

/**
 * enable right pane of Game area
 * Add event listeners to each button 
 */
function setupRightPaneGameArea(country, gameType) {
    const rightPane = document.getElementsByClassName('right-pane');
    const pane = rightPane[0];
    // Make the right pane visible and interactive
    pane.classList.remove('hidden');
    pane.classList.remove('disabled');
    pane.classList.remove('transparent');
    pane.setAttribute('aria-hidden', 'false');
    

   


    // rightPane[0].classList.remove('visible');

    // Enable any buttons and build event listeners
    const question = document.getElementsByClassName("row-1");
    if (question && question[0]) {
        switch (gameType) {
            case "population":
                question[0].textContent = `Quiz on Population of ${country} and 9 others`;
                break;
            case "currency":
                question[0].textContent = `Quiz on Currency with ${country} and 9 others`;
                break;
            case "languages":
                question[0].textContent = `Quiz on Languages with ${country} and 9 others`;
                break;
            default:
                alert(`Unknown game type: ${gameType}`);
                throw `Unknown game type: ${gameType}. Aborting!`;
        }

    }

    // Ensure quiz body and row-1 are visible
    const quizBody = pane.querySelector('.quiz__body');
    if (quizBody) {
        quizBody.classList.remove('hidden');
        quizBody.setAttribute('aria-hidden', 'false');
    }
    const row1 = pane.querySelector('.row-1');
    if (row1) {
        row1.classList.remove('hidden');
        row1.setAttribute('aria-hidden', 'false');
    }
    const startBtn = document.getElementById('showOverlayBtn');
    if (startBtn) {
        startBtn.classList.remove('hidden');
        startBtn.removeAttribute('disabled');
        startBtn.style.visibility = 'visible';
        startBtn.setAttribute('aria-hidden', 'false');
    }

    // Hide rows 2, 3, and 4 initially
    const rowsToHide = pane.querySelectorAll('.row-2, .row-3, .row-4');
    rowsToHide.forEach(row => {
        row.classList.add('hidden');
        row.setAttribute('aria-hidden', 'true');
    });
    const buttons = rightPane[0].getElementsByTagName('button');
    for (let button of buttons) {
        // Visually and functionally enab
        button.visible = true;
        button.addEventListener("click", function () {
            // Handle answer selection
            console.log(`You selected ${this.textContent} for game type: ${country}`);

        });
    }

    const btn = document.getElementById('showOverlayBtn');
   if (btn) {
        btn.addEventListener('click', () => beginQuiz(country), { once: true });
    }


}

/**
 * Begin the quiz: show overlay immediately, then hide after a delay
 */
function beginQuiz(country) {
    const pane = document.querySelector('.right-pane');
    const overlay = pane ? pane.querySelector('.overlay') : null;
    if (!overlay) {
        console.warn('Overlay element not found');
        return;
    }
    // Show overlay using CSS .overlay.show rules
    overlay.classList.add('show');

    // Update message to a simple downloading status
    const msg = overlay.querySelector('.overlay-text');
    if (msg) {
        msg.textContent = 'Downloading quiz...';
    }

    // After a short delay (simulate download), hide overlay and reveal quiz rows
    setTimeout(() => completeQuizLoading(), 1000);
}

/**
 * Hide the overlay and reveal rows 2-4 in the right pane
 */
function completeQuizLoading() {

    
    const pane = document.querySelector('.right-pane');
    if (!pane) return;
    const overlay = pane.querySelector('.overlay');
    if (overlay) overlay.classList.remove('show');

    // const rowsToShow = pane.querySelectorAll('.row-2, .row-3, .row-4');
    // rowsToShow.forEach(row => {
    //     row.classList.remove('hidden');
    //     row.setAttribute('aria-hidden', 'false');
    // });

     setTimeout(() => {
        GenerateQuizQuestions();
    }, 5000);
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
 * Checks the answer agaist the first element in
 * the returned calculateCorrectAnswer array
 */
function checkAnswer() {

    // let userAnswer = parseInt(document.getElementById("answer-box").value);
    // let calculatedAnswer = calculateCorrectAnswer();
    // let isCorrect = userAnswer === calculatedAnswer[0];

    // if (isCorrect) {
    //     // alert("Hey! You got it right! :D"); 
    //     incrementScore();
    // } else {
    //     // alert(`Awwww.... you answered ${userAnswer}. The correct answer was ${calculatedAnswer[0]}!`);
    //     incrementWrongAnswer();
    // }

    // runGame(calculatedAnswer[1]);

}


/**
 * Gets the operands (the numbers) and the operator (plus, minus etc)
 * directly from the dom, and returns the correct answer.
 */
function calculateCorrectAnswer() {

    // let operand1 = parseInt(document.getElementById('operand1').innerText);
    // let operand2 = parseInt(document.getElementById('operand2').innerText);
    // let operator = document.getElementById("operator").innerText;

    // if (operator === "+") {
    //     return [operand1 + operand2, "addition"];
    // } else if (operator === "x") {
    //     return [operand1 * operand2, "multiply"];
    // } else if (operator === "-") {
    //     return [operand1 - operand2, "subtract"];
    // } else if (operator === "/") {
    //     return [operand1 / operand2, "division"];
    // } else {
    //     alert(`Unimplemented operator ${operator}`);
    //     throw `Unimplemented operator ${operator}. Aborting!`;
    // }

}

/**
 * Gets the current score from the DOM and increments it by 1
 */
function incrementScore() {

    // let oldScore = parseInt(document.getElementById("score").innerText);
    // document.getElementById("score").innerText = ++oldScore;

}

/**
 * Gets the current tally of incorrect answers from the DOM and increments it by 1
 */
function incrementWrongAnswer() {

    // let oldScore = parseInt(document.getElementById("incorrect").innerText);
    // document.getElementById("incorrect").innerText = ++oldScore;

}

function displayAdditionQuestion(operand1, operand2) {

    // document.getElementById('operand1').textContent = operand1;
    // document.getElementById('operand2').textContent = operand2;
    // document.getElementById('operator').textContent = "+";

}

function displaySubtractQuestion(operand1, operand2) {

    // document.getElementById("operand1").textContent = operand1 > operand2 ? operand1 : operand2;
    // document.getElementById("operand2").textContent = operand1 > operand2 ? operand2 : operand1;
    // document.getElementById('operator').textContent = "-";

}

function displayMultiplyQuestion(operand1, operand2) {

    // document.getElementById('operand1').textContent = operand1;
    // document.getElementById('operand2').textContent = operand2;
    // document.getElementById('operator').textContent = "x";

}

function displayDivisionQuestion(operand1, operand2) {
//     operand1 = operand1 * operand2;
//     document.getElementById("operand1").textContent = operand1;
//     document.getElementById("operand2").textContent = operand2;
//     document.getElementById("operator").textContent = "/";
}