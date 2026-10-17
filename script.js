const searchInput = document.getElementById("search-input");
const regionSelect = document.getElementById("region-select");
const sortSelect = document.getElementById("sort-select");
const grid = document.getElementById("grid");
const count = document.getElementById("count");
const message = document.getElementById("message");

const exploreView = document.getElementById("explore-view");
const detailsView = document.getElementById("details-view");
const quizView = document.getElementById("quiz-view");
const exploreNav = document.getElementById("explore-nav");
const quizNav = document.getElementById("quiz-nav");

const countriesUrl = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const populationUrl = "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=400&mrnev=1";

let countries = [];

async function start() {
  message.textContent = "Loading countries...";

  try {
    const response = await fetch(countriesUrl);
    const data = await response.json();

    // population is from world bank api
    const populations = await getPopulations();

    for (let i = 0; i < data.length; i++) {
      countries.push(makeCountry(data[i], populations));
    }

    message.textContent = "";
    showCountries();
    updateBestScores();
  } catch (error) {
    console.log(error);
    message.textContent = "Could not load countries, try again later";
  }
}

async function getPopulations() {
  const populations = {};
  try {
    const response = await fetch(populationUrl);
    const data = await response.json();
    for (let i = 0; i < data[1].length; i++) {
      populations[data[1][i].countryiso3code] = data[1][i].value;
    }
  } catch (error) {
    console.log(error);
  }
  return populations;
}

function makeCountry(c, populations) {
  let nativeName = c.name.common;
  const nativeKeys = Object.keys(c.name.native);
  if (nativeKeys.length > 0) {
    nativeName = c.name.native[nativeKeys[0]].common;
  }

  const languages = [];
  for (const code in c.languages) {
    languages.push(c.languages[code]);
  }

  const currencies = [];
  for (const code in c.currencies) {
    currencies.push(c.currencies[code].name + " (" + c.currencies[code].symbol + ")");
  }

  return {
    name: c.name.common,
    official: c.name.official,
    native: nativeName,
    code: c.cca3,
    flag: "https://flagcdn.com/w320/" + c.cca2.toLowerCase() + ".png",
    capital: c.capital[0] || "",
    region: c.region,
    subregion: c.subregion,
    population: populations[c.cca3] || 0,
    area: c.area,
    languages: languages,
    currencies: currencies,
    borders: c.borders,
    landlocked: c.landlocked
  };
}

function formatNumber(num) {
  if (!num) {
    return "N/A";
  }
  return num.toLocaleString();
}

function showCountries() {
  const text = searchInput.value.trim().toLowerCase();
  const region = regionSelect.value;

  let list = countries.filter(function (c) {
    const matchName = c.name.toLowerCase().includes(text);
    const matchRegion = region === "" || c.region === region;
    return matchName && matchRegion;
  });

  if (sortSelect.value === "name") {
    list.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  } else if (sortSelect.value === "population") {
    list.sort(function (a, b) {
      return b.population - a.population;
    });
  } else {
    list.sort(function (a, b) {
      return b.area - a.area;
    });
  }

  grid.innerHTML = "";
  for (let i = 0; i < list.length; i++) {
    grid.appendChild(createCard(list[i]));
  }

  if (list.length === 0) {
    count.textContent = "No countries found";
  } else {
    count.textContent = "Showing " + list.length + " countries";
  }
}

function createCard(country) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img src="${country.flag}" alt="${country.name} flag" loading="lazy">
    <div class="card-body">
      <h3>${country.name}</h3>
      <p><b>Population:</b> ${formatNumber(country.population)}</p>
      <p><b>Region:</b> ${country.region}</p>
      <p><b>Capital:</b> ${country.capital || "None"}</p>
    </div>
  `;

  card.onclick = function () {
    showDetails(country.code);
  };

  return card;
}

function findCountry(code) {
  for (let i = 0; i < countries.length; i++) {
    if (countries[i].code === code) {
      return countries[i];
    }
  }
  return null;
}

function showDetails(code) {
  const country = findCountry(code);

  document.getElementById("d-flag").src = country.flag;
  document.getElementById("d-name").textContent = country.name;
  document.getElementById("d-official").textContent = country.official;
  document.getElementById("d-native").textContent = country.native;
  document.getElementById("d-population").textContent = formatNumber(country.population);
  document.getElementById("d-region").textContent = country.region;
  document.getElementById("d-subregion").textContent = country.subregion || "-";
  document.getElementById("d-capital").textContent = country.capital || "None";
  document.getElementById("d-area").textContent = formatNumber(country.area) + " km²";
  document.getElementById("d-languages").textContent = country.languages.join(", ") || "-";
  document.getElementById("d-currencies").textContent = country.currencies.join(", ") || "-";

  if (country.landlocked) {
    document.getElementById("d-landlocked").textContent = "Yes";
  } else {
    document.getElementById("d-landlocked").textContent = "No";
  }

  const bordersBox = document.getElementById("d-borders");
  bordersBox.innerHTML = "";

  if (country.borders.length === 0) {
    bordersBox.textContent = "None";
  }

  for (let i = 0; i < country.borders.length; i++) {
    const neighbour = findCountry(country.borders[i]);
    if (!neighbour) continue;

    const btn = document.createElement("button");
    btn.className = "border-btn";
    btn.textContent = neighbour.name;
    btn.onclick = function () {
      showDetails(neighbour.code);
    };
    bordersBox.appendChild(btn);
  }

  document.getElementById("d-map").href = "https://www.google.com/maps/place/" + country.name;

  exploreView.classList.add("hidden");
  detailsView.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function showView(view) {
  exploreView.classList.add("hidden");
  detailsView.classList.add("hidden");
  quizView.classList.add("hidden");
  view.classList.remove("hidden");

  if (view === quizView) {
    exploreNav.classList.remove("active");
    quizNav.classList.add("active");
  } else {
    quizNav.classList.remove("active");
    exploreNav.classList.add("active");
  }
}

searchInput.addEventListener("input", showCountries);
regionSelect.onchange = showCountries;
sortSelect.onchange = showCountries;

document.getElementById("random-btn").onclick = function () {
  const random = countries[Math.floor(Math.random() * countries.length)];
  showDetails(random.code);
};

document.getElementById("back-btn").onclick = function () {
  showView(exploreView);
};

exploreNav.onclick = function () {
  showView(exploreView);
};

quizNav.onclick = function () {
  showView(quizView);
  showQuizScreen("quiz-start");
};

// ---- QUIZ ----

const quizStart = document.getElementById("quiz-start");
const quizQuestion = document.getElementById("quiz-question");
const quizEnd = document.getElementById("quiz-end");
const optionsBox = document.getElementById("q-options");
const nextBtn = document.getElementById("next-btn");

const totalQuestions = 10;
let quizMode = "";
let questions = [];
let questionIndex = 0;
let score = 0;
let streak = 0;

function showQuizScreen(id) {
  quizStart.classList.add("hidden");
  quizQuestion.classList.add("hidden");
  quizEnd.classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

function shuffle(array) {
  return array.sort(function () {
    return Math.random() - 0.5;
  });
}

function startQuiz(mode) {
  quizMode = mode;
  questionIndex = 0;
  score = 0;
  streak = 0;

  // some countries dont have capital
  let pool = countries.filter(function (c) {
    if (mode === "capital") {
      return c.capital !== "";
    }
    return true;
  });

  questions = shuffle(pool.slice()).slice(0, totalQuestions);
  showQuizScreen("quiz-question");
  showQuestion();
}

function showQuestion() {
  const country = questions[questionIndex];
  nextBtn.classList.add("hidden");

  document.getElementById("q-number").textContent = "Question " + (questionIndex + 1) + "/" + totalQuestions;
  document.getElementById("q-score").textContent = "Score: " + score;
  document.getElementById("q-streak").textContent = "🔥 " + streak;
  document.getElementById("progress-fill").style.width = (questionIndex / totalQuestions) * 100 + "%";

  const flagImg = document.getElementById("q-flag");
  let correct;

  if (quizMode === "flag") {
    flagImg.src = country.flag;
    flagImg.classList.remove("hidden");
    document.getElementById("q-text").textContent = "Which country's flag is this?";
    correct = country.name;
  } else {
    flagImg.classList.add("hidden");
    document.getElementById("q-text").textContent = "What is the capital of " + country.name + "?";
    correct = country.capital;
  }

  // add 3 random wrong answers
  const options = [correct];
  while (options.length < 4) {
    const random = countries[Math.floor(Math.random() * countries.length)];
    let answer = random.name;
    if (quizMode === "capital") {
      answer = random.capital;
    }
    if (answer !== "" && !options.includes(answer)) {
      options.push(answer);
    }
  }
  shuffle(options);

  optionsBox.innerHTML = "";
  for (let i = 0; i < options.length; i++) {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = options[i];
    btn.onclick = function () {
      checkAnswer(btn, correct);
    };
    optionsBox.appendChild(btn);
  }
}

function checkAnswer(clickedBtn, correct) {
  const buttons = document.querySelectorAll(".option-btn");

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
    if (buttons[i].textContent === correct) {
      buttons[i].classList.add("correct");
    }
  }

  if (clickedBtn.textContent === correct) {
    score++;
    streak++;
  } else {
    clickedBtn.classList.add("wrong");
    streak = 0;
  }

  document.getElementById("q-score").textContent = "Score: " + score;
  document.getElementById("q-streak").textContent = "🔥 " + streak;

  if (questionIndex === totalQuestions - 1) {
    nextBtn.textContent = "See Result";
  } else {
    nextBtn.textContent = "Next →";
  }
  nextBtn.classList.remove("hidden");
}

function endQuiz() {
  const key = "best-" + quizMode;
  const best = Number(localStorage.getItem(key)) || 0;

  if (score > best) {
    localStorage.setItem(key, score);
    document.getElementById("end-best").textContent = "🏆 New best score!";
  } else {
    document.getElementById("end-best").textContent = "Best score: " + best + "/" + totalQuestions;
  }

  let title = "Keep practicing! 💪";
  if (score >= 8) {
    title = "Amazing! 🎉";
  } else if (score >= 5) {
    title = "Good job! 👍";
  }

  document.getElementById("end-title").textContent = title;
  document.getElementById("end-score").textContent = "You scored " + score + " out of " + totalQuestions;

  updateBestScores();
  showQuizScreen("quiz-end");
}

function updateBestScores() {
  const flagBest = localStorage.getItem("best-flag");
  const capitalBest = localStorage.getItem("best-capital");

  if (flagBest) {
    document.getElementById("flag-best").textContent = "Best: " + flagBest + "/" + totalQuestions;
  }
  if (capitalBest) {
    document.getElementById("capital-best").textContent = "Best: " + capitalBest + "/" + totalQuestions;
  }
}

nextBtn.onclick = function () {
  questionIndex++;
  if (questionIndex === totalQuestions) {
    endQuiz();
  } else {
    showQuestion();
  }
};

document.getElementById("flag-mode-btn").onclick = function () {
  startQuiz("flag");
};

document.getElementById("capital-mode-btn").onclick = function () {
  startQuiz("capital");
};

document.getElementById("again-btn").onclick = function () {
  startQuiz(quizMode);
};

document.getElementById("change-mode-btn").onclick = function () {
  showQuizScreen("quiz-start");
};

start();
