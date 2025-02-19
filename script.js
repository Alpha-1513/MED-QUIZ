// Google Gemini API Key (Replace with your actual key)
const GEMINI_API_KEY = 'AIzaSyCSjT_qOcSY-YcViZgRV3WQC8vKT-i3f28';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

// Quiz State Management
let currentUser = '';
let questions = [];
let currentQuestion = 0;
let score = 0;
let previousScores = JSON.parse(localStorage.getItem('medQuizScores')) || {};

// Fetch Questions from Google Gemini API
async function fetchQuestions(topic) {
  const prompt = `Generate 10 medical multiple-choice questions about ${topic}. Format response as a JSON array containing objects with:
    - "question": string
    - "options": array of 4 strings
    - "correct": number (0-3 index)
    Example: 
    [{
        "question": "What is...?",
        "options": ["A", "B", "C", "D"],
        "correct": 0
    }]`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates[0].content.parts[0].text;

    // Clean and parse JSON response
    const cleanedContent = rawContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('API Error:', error);
    alert('Failed to load questions. Using backup questions.');
    return backupQuestions();
  }
}

// Backup Question System
function backupQuestions() {
  return [
    { question: "What is the medical term for a heart attack?", options: ["Myocardial infarction", "Angina pectoris", "Cardiac arrest", "Atherosclerosis"], correct: 0 },
    { question: "Which part of the brain is responsible for motor control?", options: ["Cerebellum", "Frontal lobe", "Brain stem", "Occipital lobe"], correct: 0 },
    { question: "Which vitamin deficiency causes scurvy?", options: ["Vitamin C", "Vitamin D", "Vitamin B12", "Vitamin K"], correct: 0 },
    { question: "What is the normal range for blood pH?", options: ["7.35-7.45", "7.0-7.2", "7.5-7.8", "6.9-7.1"], correct: 0 },
    { question: "Which organ produces insulin?", options: ["Pancreas", "Liver", "Kidney", "Spleen"], correct: 0 }
    ];
}

// Attach function to global scope to avoid "startQuiz is not defined" error
window.startQuiz = async function() {
  currentUser = document.getElementById('username').value.trim();
  if (!currentUser) {
    alert('Please enter your name');
    return;
  }

  const topic = document.getElementById('topicSelect').value;

  try {
    questions = await fetchQuestions(topic);
    if (questions.length < 10) {
      alert(`Warning: Only ${questions.length} questions available`);
    }
    questions = questions.slice(0, 10);
  } catch (error) {
    console.error('Error loading questions:', error);
    questions = backupQuestions();
  }

  document.getElementById('loginContainer').classList.add('hidden');
  document.getElementById('quizContainer').classList.remove('hidden');
  showQuestion();
};

// Function to display a question
function showQuestion() {
  const question = questions[currentQuestion];
  document.getElementById('questionNumber').textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
  document.getElementById('question').textContent = question.question;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';

  question.options.forEach((option, index) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.textContent = option;
    optionDiv.onclick = () => checkAnswer(index);
    optionsDiv.appendChild(optionDiv);
  });

  document.getElementById('score').textContent = `Current Score: ${score}`;
}

// Function to check the user's answer
function checkAnswer(selectedIndex) {
  const question = questions[currentQuestion];
  const options = document.getElementsByClassName('option');

  // Show correct/wrong answers
  options[question.correct].classList.add('correct');
  if (selectedIndex !== question.correct) {
    options[selectedIndex].classList.add('wrong');
  }

  // Update score
  if (selectedIndex === question.correct) {
    score += 10;
  }

  // Progress to next question
  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      endQuiz();
    }
  }, 1500);
}

// Function to end the quiz
function endQuiz() {
  document.getElementById('quizContainer').classList.add('hidden');
  document.getElementById('resultContainer').classList.remove('hidden');

  // Display final score
  const finalScoreDiv = document.getElementById('finalScore');
  finalScoreDiv.textContent = `Final Score: ${score}/100`;

  // Compare with previous score
  const previousScoreDiv = document.getElementById('previousScore');
  const previousScore = previousScores[currentUser] || 0;
  previousScoreDiv.textContent = `Previous Best: ${previousScore}/100`;
  previousScoreDiv.style.color = score > previousScore ? "#2ecc71" : "#e74c3c";

  // Update local storage if new high score
  if (score > previousScore) {
    previousScores[currentUser] = score;
    localStorage.setItem('medQuizScores', JSON.stringify(previousScores));
  }
}
