// Wait for the DOM to finish loading before running the game
// Get the button elements and add event listeners to them

document.addEventListener("DOMContentLoaded", function() {
    // Only attach global listeners to mode buttons with data-type
    const modeButtons = document.querySelectorAll('button[data-type]');
    for (let button of modeButtons) {
        button.addEventListener("click", function() {
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

        for (let country of countries) {
            switch(gameType){
                case "population":
                    country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--population-color');
                    break;
                case "currency":
                    country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--currency-color');
                    break;
                case "languages":
                    country.style.color = getComputedStyle(document.documentElement).getPropertyValue('--languages-color');
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
function setupLeftPaneGameArea(gameType){
    const leftPane = document.getElementsByClassName('left-pane');
 
    const countries = document.querySelectorAll('.item-list .country');
   

    leftPane[0].classList.remove('disabled');  // enable left pane
    leftPane[0].classList.add('visible');
  
    // build event listeners
    for (let country of countries) {
        country.addEventListener("click", function() {
        // Handle country selection
          //  alert(`You selected ${this.textContent} for game type: ${gameType}`);
          console.log(`You selected ${this.textContent} for game type: ${gameType}`);
          setupRightPaneGameArea(country.textContent);
       //   document.documentElement.style.setProperty('--languages-color', this.textContent);
        });
    }
    
// Close the message and show the quiz

};

/**
 * enable right pane of Game area
 * Add event listeners to each button 
 */
function setupRightPaneGameArea(country) {
    const rightPane = document.getElementsByClassName('right-pane');
    rightPane[0].classList.remove('hidden');
  // rightPane[0].classList.remove('visible');

    // Enable any buttons and build event listeners
    const question = document.getElementsByClassName("row-1");
    question[0].textContent = `Quiz about ${country}`;
    const buttons = rightPane[0].getElementsByTagName('button');
    for (let button of buttons) {
        // Visually and functionally enab
        button.visible = true;
        button.addEventListener("click", function() {
            // Handle answer selection
            console.log(`You selected ${this.textContent} for game type: ${country.textContent}`);
            
        });
    }
}
/**
 * Checks the answer agaist the first element in
 * the returned calculateCorrectAnswer array
 */
function checkAnswer() {

    let userAnswer = parseInt(document.getElementById("answer-box").value);
    let calculatedAnswer = calculateCorrectAnswer();
    let isCorrect = userAnswer === calculatedAnswer[0];

    if (isCorrect) {
        // alert("Hey! You got it right! :D"); 
        incrementScore();
    } else {
        // alert(`Awwww.... you answered ${userAnswer}. The correct answer was ${calculatedAnswer[0]}!`);
        incrementWrongAnswer();
    }

    runGame(calculatedAnswer[1]);

}


/**
 * Gets the operands (the numbers) and the operator (plus, minus etc)
 * directly from the dom, and returns the correct answer.
 */
function calculateCorrectAnswer() {

    let operand1 = parseInt(document.getElementById('operand1').innerText);
    let operand2 = parseInt(document.getElementById('operand2').innerText);
    let operator = document.getElementById("operator").innerText;

    if (operator === "+") {
        return [operand1 + operand2, "addition"];
    } else if (operator === "x") {
        return [operand1 * operand2, "multiply"];
    } else if (operator === "-") {
        return [operand1 - operand2, "subtract"];
    } else if (operator ==="/") {
		return [operand1 / operand2, "division"];
    } else {
        alert(`Unimplemented operator ${operator}`);
        throw `Unimplemented operator ${operator}. Aborting!`;
    }

}

/**
 * Gets the current score from the DOM and increments it by 1
 */
function incrementScore() {

    let oldScore = parseInt(document.getElementById("score").innerText);
    document.getElementById("score").innerText = ++oldScore;

}

/**
 * Gets the current tally of incorrect answers from the DOM and increments it by 1
 */
function incrementWrongAnswer() {

    let oldScore = parseInt(document.getElementById("incorrect").innerText);
    document.getElementById("incorrect").innerText = ++oldScore;
    
}

function displayAdditionQuestion(operand1, operand2) {

    document.getElementById('operand1').textContent = operand1;
    document.getElementById('operand2').textContent = operand2;
    document.getElementById('operator').textContent = "+";
    
}

function displaySubtractQuestion(operand1, operand2) {

    document.getElementById("operand1").textContent = operand1 > operand2 ? operand1 : operand2;
    document.getElementById("operand2").textContent = operand1 > operand2 ? operand2 : operand1;
    document.getElementById('operator').textContent = "-";

}

function displayMultiplyQuestion(operand1, operand2) {

    document.getElementById('operand1').textContent = operand1;
    document.getElementById('operand2').textContent = operand2;
    document.getElementById('operator').textContent = "x";

}

function displayDivisionQuestion(operand1, operand2) {
    operand1 = operand1 * operand2;
    document.getElementById("operand1").textContent = operand1;
    document.getElementById("operand2").textContent = operand2;
    document.getElementById("operator").textContent = "/";
}