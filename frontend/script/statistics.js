document.addEventListener("DOMContentLoaded", function () {
  // Демо-данные для статистики
  const statsData = {
    balanceTrend: {
      week: {
        labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
        data: [220000, 225000, 230000, 235000, 240000, 242000, 245780],
      },
      month: {
        labels: ["1-7", "8-14", "15-21", "22-28", "29-31"],
        data: [200000, 215000, 230000, 240000, 245780],
      },
      year: {
        labels: [
          "Янв",
          "Фев",
          "Мар",
          "Апр",
          "Май",
          "Июн",
          "Июл",
          "Авг",
          "Сен",
          "Окт",
          "Ноя",
          "Дек",
        ],
        data: [
          180000, 185000, 190000, 200000, 210000, 220000, 225000, 230000,
          235000, 240000, 242000, 245780,
        ],
      },
    },
    incomeExpense: {
      all: {
        income: 85000,
        expenses: 42300,
        categories: {
          food: 18450,
          transport: 8700,
          housing: 25000,
        },
      },
    },
    categories: [
      { name: "Еда", amount: 18450, color: "#2041ff" },
      { name: "Транспорт", amount: 8700, color: "#2ecc71" },
      { name: "Жильё", amount: 25000, color: "#e74c3c" },
      { name: "Развлечения", amount: 5000, color: "#f39c12" },
      { name: "Одежда", amount: 3000, color: "#9b59b6" },
    ],
    monthsComparison: {
      current: [25000, 15000, 40000, 10000, 8000],
      previous: [22000, 12000, 38000, 15000, 5000],
      labels: ["Еда", "Транспорт", "Жильё", "Развлечения", "Одежда"],
    },
  };

  // Инициализация графиков
  initBalanceTrendChart();
  initIncomeExpenseChart();
  initExpenseCategoriesChart();
  initMonthComparisonChart();
  initDetailsButtons();

  // График динамики баланса
  function initBalanceTrendChart() {
    const ctx = document.getElementById("balanceTrendChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: statsData.balanceTrend.month.labels,
        datasets: [
          {
            label: "Общий баланс",
            data: statsData.balanceTrend.month.data,
            borderColor: "#2041ff",
            backgroundColor: "rgba(32, 65, 255, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: getChartOptions("₽"),
    });

    // Обработчик изменения периода
    document
      .getElementById("period-select")
      .addEventListener("change", function () {
        const period = this.value;
        chart.data.labels = statsData.balanceTrend[period].labels;
        chart.data.datasets[0].data = statsData.balanceTrend[period].data;
        chart.update();
      });
  }

  // График доходов/расходов
  function initIncomeExpenseChart() {
    const ctx = document.getElementById("incomeExpenseChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Доходы", "Расходы"],
        datasets: [
          {
            data: [
              statsData.incomeExpense.all.income,
              -statsData.incomeExpense.all.expenses,
            ],
            backgroundColor: ["#2ecc71", "#e74c3c"],
            borderRadius: 8,
          },
        ],
      },
      options: getChartOptions("₽", false),
    });
  }

  // Круговой график категорий расходов
  function initExpenseCategoriesChart() {
    const ctx = document
      .getElementById("expenseCategoriesChart")
      .getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: statsData.categories.map((c) => c.name),
        datasets: [
          {
            data: statsData.categories.map((c) => c.amount),
            backgroundColor: statsData.categories.map((c) => c.color),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        cutout: "70%",
      },
    });
  }

  // Сравнение месяцев
  function initMonthComparisonChart() {
    const ctx = document
      .getElementById("monthComparisonChart")
      .getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: statsData.monthsComparison.labels,
        datasets: [
          {
            label: "Текущий месяц",
            data: statsData.monthsComparison.current,
            backgroundColor: "#2041ff",
            borderRadius: 4,
          },
          {
            label: "Прошлый месяц",
            data: statsData.monthsComparison.previous,
            backgroundColor: "#a0c4da",
            borderRadius: 4,
          },
        ],
      },
      options: getChartOptions("₽"),
    });
  }

  // Работа с кнопками "Детали"
  function initDetailsButtons() {
    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const targetId = this.dataset.target;
        const card = this.closest(".scrollable-card");
        card.classList.toggle("active");

        // Заполняем данные при первом открытии
        if (card.classList.contains("active") && !card.dataset.loaded) {
          loadDetailsData(targetId);
          card.dataset.loaded = true;
        }
      });
    });
  }

  // Загрузка детализированных данных
  function loadDetailsData(targetId) {
    if (targetId === "monthComparisonDetails") {
      const tbody = document.querySelector(`#${targetId} tbody`);
      tbody.innerHTML = statsData.monthsComparison.labels
        .map(
          (label, i) => `
          <tr>
            <td>${label}</td>
            <td>${statsData.monthsComparison.current[i].toLocaleString(
              "ru-RU"
            )} ₽</td>
            <td>${statsData.monthsComparison.previous[i].toLocaleString(
              "ru-RU"
            )} ₽</td>
            <td class="${
              statsData.monthsComparison.current[i] >=
              statsData.monthsComparison.previous[i]
                ? "positive"
                : "negative"
            }">
              ${Math.abs(
                statsData.monthsComparison.current[i] -
                  statsData.monthsComparison.previous[i]
              ).toLocaleString("ru-RU")} ₽
            </td>
          </tr>
        `
        )
        .join("");
    } else if (targetId === "categoriesDetails") {
      const container = document.querySelector(`#${targetId} .categories-list`);
      container.innerHTML = statsData.categories
        .map(
          (category) => `
          <div class="category-item">
            <div class="category-color" style="background: ${
              category.color
            };"></div>
            <span class="category-name">${category.name}</span>
            <span class="category-amount">-${category.amount.toLocaleString(
              "ru-RU"
            )} ₽</span>
            <span class="category-percent">${Math.round(
              (category.amount / statsData.incomeExpense.all.expenses) * 100
            )}%</span>
          </div>
        `
        )
        .join("");

      // Заполняем пример транзакций
      const transactionsList = document.querySelector(
        `#${targetId} .transactions-list`
      );
      transactionsList.innerHTML = `
          <div class="transaction-item">
            <div class="transaction-icon" style="background: ${statsData.categories[0].color}20; color: ${statsData.categories[0].color};">
              <i class="bx bx-shopping-bag"></i>
            </div>
            <div class="transaction-details">
              <div class="transaction-header">
                <h3>Продукты</h3>
                <span class="transaction-amount expense">-3,450 ₽</span>
              </div>
              <p>Супермаркет "Пятерочка"</p>
              <span class="transaction-date">12.04.2023</span>
            </div>
          </div>
          <div class="transaction-item">
            <div class="transaction-icon" style="background: ${statsData.categories[1].color}20; color: ${statsData.categories[1].color};">
              <i class="bx bx-taxi"></i>
            </div>
            <div class="transaction-details">
              <div class="transaction-header">
                <h3>Такси</h3>
                <span class="transaction-amount expense">-850 ₽</span>
              </div>
              <p>Поездка на работу</p>
              <span class="transaction-date">10.04.2023</span>
            </div>
          </div>
          <div class="transaction-item">
            <div class="transaction-icon" style="background: ${statsData.categories[2].color}20; color: ${statsData.categories[2].color};">
              <i class="bx bx-home"></i>
            </div>
            <div class="transaction-details">
              <div class="transaction-header">
                <h3>Аренда</h3>
                <span class="transaction-amount expense">-25,000 ₽</span>
              </div>
              <p>Оплата жилья</p>
              <span class="transaction-date">05.04.2023</span>
            </div>
          </div>
        `;
    }
  }

  // Общие настройки графиков
  function getChartOptions(currencySymbol, showLegend = true) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: showLegend },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label || ""}: ${Math.abs(
                context.raw
              ).toLocaleString("ru-RU")} ${currencySymbol}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return value.toLocaleString("ru-RU") + " " + currencySymbol;
            },
          },
        },
      },
    };
  }
});
