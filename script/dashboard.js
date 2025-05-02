document.addEventListener("DOMContentLoaded", function () {
  // Инициализация демонстрационных данных
  const demoData = {
    balance: {
      total: 245780.5,
      accounts: [
        { name: "Наличные", amount: 45000 },
        { name: "Банковская карта", amount: 150780.5 },
        { name: "Сберегательный счет", amount: 50000 },
      ],
    },
    weeklyProgress: {
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      datasets: [
        {
          label: "Общий баланс",
          data: [220000, 225000, 230000, 235000, 240000, 242000, 245780],
          borderColor: "#2041ff",
          backgroundColor: "rgba(32, 65, 255, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Накопления",
          data: [40000, 42000, 45000, 47000, 48000, 49000, 50000],
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    transactions: {
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      datasets: [
        {
          label: "Доходы",
          data: [85000, 0, 0, 0, 0, 0, 0],
          backgroundColor: "#2ecc71",
          borderRadius: 4,
        },
        {
          label: "Расходы",
          data: [4500, 3200, 2800, 1500, 5200, 2100, 3800],
          backgroundColor: "#e74c3c",
          borderRadius: 4,
        },
      ],
    },
    monthlyStats: {
      labels: ["Еда", "Транспорт", "Жильё", "Развлечения", "Одежда"],
      data: [25000, 15000, 40000, 10000, 8000],
    },
    goals: [
      { title: "Новый телефон", current: 75000, target: 100000 },
      { title: "Отпуск", current: 45000, target: 150000 },
    ],
    motivators: [
      "Каждая копейка приближает вас к цели!",
      "Маленькие шаги приводят к большим результатам.",
      "Финансовая дисциплина - ключ к успеху!",
    ],
  };

  // Инициализация компонентов
  initBalance(demoData.balance);
  initWeeklyProgressChart(demoData.weeklyProgress);
  initTransactionsChart(demoData.transactions);
  initMonthlyChart(demoData.monthlyStats);
  initGoals(demoData.goals);
  initMotivation(demoData.motivators);
  initCurrencyToggle();
  initGreeting();
  initNotifications();

  // Функция инициализации баланса
  function initBalance(data) {
    const totalElement = document.getElementById("total-balance");
    const detailsContainer = document.querySelector(".balance-details");

    totalElement.textContent = formatCurrency(data.total, "RUB");
    totalElement.dataset.original = data.total;

    detailsContainer.innerHTML = data.accounts
      .map(
        (account) => `
      <div class="balance-item">
        <span>${account.name}:</span>
        <span class="amount" data-original="${account.amount}">
          ${formatCurrency(account.amount, "RUB")}
        </span>
      </div>
    `
      )
      .join("");
  }

  // Функция инициализации графика прогресса за неделю
  function initWeeklyProgressChart(data) {
    const ctx = document.getElementById("weeklyProgressChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return value.toLocaleString("ru-RU") + " ₽";
              },
            },
          },
        },
      },
    });
  }

  // Функция инициализации графика транзакций
  function initTransactionsChart(data) {
    const ctx = document.getElementById("transactionsChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return (
                  context.dataset.label +
                  ": " +
                  context.raw.toLocaleString("ru-RU") +
                  " ₽"
                );
              },
            },
          },
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString("ru-RU") + " ₽";
              },
            },
          },
        },
      },
    });
  }

  // Функция инициализации графика за месяц
  function initMonthlyChart(data) {
    const ctx = document.getElementById("monthlyChart").getContext("2d");
    new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.data,
            backgroundColor: [
              "#2041ff",
              "#2ecc71",
              "#e74c3c",
              "#f39c12",
              "#9b59b6",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" },
        },
      },
    });
  }

  // Функция инициализации финансовых целей
  function initGoals(goals) {
    const container = document.querySelector(".goals-list");
    container.innerHTML = goals
      .map((goal) => {
        const progress = (goal.current / goal.target) * 100;
        return `
        <div class="goal-item">
          <div class="goal-info">
            <h3>${goal.title}</h3>
            <span class="goal-progress">
              ${formatCurrency(goal.current, "RUB")} / ${formatCurrency(
          goal.target,
          "RUB"
        )}
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${progress}%"></div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Функция инициализации мотивационного текста
  function initMotivation(motivators) {
    const motivator = motivators[Math.floor(Math.random() * motivators.length)];
    document.getElementById("motivation-text").textContent = motivator;
  }

  // Функция инициализации переключения валют
  function initCurrencyToggle() {
    const toggleBtn = document.getElementById("currency-toggle");
    const currencySymbol = document.getElementById("currency-symbol");
    const totalElement = document.getElementById("total-balance");
    const amountElements = document.querySelectorAll(".amount");

    const currencies = [
      { code: "RUB", symbol: "₽", rate: 1 },
      { code: "USD", symbol: "$", rate: 0.011 },
      { code: "EUR", symbol: "€", rate: 0.01 },
    ];

    let currentCurrencyIndex = 0;

    toggleBtn.addEventListener("click", function () {
      currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
      const currency = currencies[currentCurrencyIndex];

      // Обновляем кнопку
      toggleBtn.textContent = currency.symbol;
      currencySymbol.textContent = currency.symbol;

      // Обновляем суммы
      const originalTotal = parseFloat(totalElement.dataset.original);
      totalElement.textContent = formatCurrency(
        originalTotal * currency.rate,
        currency.code
      );

      amountElements.forEach((el) => {
        const original = parseFloat(el.dataset.original);
        el.textContent = formatCurrency(
          original * currency.rate,
          currency.code
        );
      });
    });
  }

  // Функция инициализации приветствия
  function initGreeting() {
    const hour = new Date().getHours();
    let greeting;

    if (hour >= 5 && hour < 12) greeting = "Доброе утро";
    else if (hour >= 12 && hour < 18) greeting = "Добрый день";
    else if (hour >= 18 && hour < 23) greeting = "Добрый вечер";
    else greeting = "Доброй ночи";

    document.getElementById(
      "greeting-text"
    ).textContent = `${greeting}, Мария!`;
  }

  // Функция инициализации уведомлений
  function initNotifications() {
    const notifications = document.querySelector(".notifications");
    const dropdown = document.querySelector(".notifications-dropdown");

    notifications.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    // Закрытие при клике вне уведомлений
    document.addEventListener("click", function () {
      if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
      }
    });
  }

  // Функция форматирования валюты
  function formatCurrency(value, currency) {
    const formatter = new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formatted = formatter.format(value);

    switch (currency) {
      case "USD":
        return formatted + " $";
      case "EUR":
        return formatted + " €";
      default:
        return formatted + " ₽";
    }
  }

  // Обработчик кнопки экспорта
  document
    .querySelector(".download-btn")
    .addEventListener("click", function () {
      alert("Данные успешно экспортированы (демо)");
    });
});
