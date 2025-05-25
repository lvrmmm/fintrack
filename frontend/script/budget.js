// .................................................
document.addEventListener("DOMContentLoaded", function () {
  console.log(localStorage.getItem("token"));

  // Конфигурация
  const config = {
    apiBaseUrl: "http://localhost:8080/api/budget",
    transactionUrl: "http://localhost:8080/api/transactions",
    colors: [
      "#2041ff",
      "#2ecc71",
      "#e74c3c",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
      "#e67e22",
      "#3498db",
      "#7f8c8d",
      "#e7adcd",
    ],
    currencies: [
      { code: "RUB", symbol: "₽", rate: 1 },
      { code: "USD", symbol: "$", rate: 0.011 },
      { code: "EUR", symbol: "€", rate: 0.01 },
    ],
    categoryIcons: {
      // Расходы (только траты)
      GROCERIES: "bx-shopping-bag",
      TRANSPORT: "bx-car",
      UTILITIES: "bx-home",
      ENTERTAINMENT: "bx-movie-play",
      HEALTH: "bx-plus-medical",
      EDUCATION: "bx-book",
      CLOTHING: "bx-cap",
      TRAVEL: "bx-plane",
      OTHER_EXPENSE: "bx-category",

      // Доходы (только поступления)
      SALARY: "bx-money",
      INVESTMENTS: "bx-trending-up",
      OTHER_INCOME: "bx-coin",
    },
    categoryNames: {
      // Расходы
      GROCERIES: "Продукты",
      TRANSPORT: "Транспорт",
      UTILITIES: "Жильё",
      ENTERTAINMENT: "Развлечения",
      HEALTH: "Здоровье",
      EDUCATION: "Образование",
      CLOTHING: "Одежда",
      TRAVEL: "Путешествия",

      // Доходы
      SALARY: "Зарплата",
      INVESTMENTS: "Инвестиции",
      GIFT: "Подарки",
      OTHER_INCOME: "Другое",
    },
    // Категории расходов (только траты)
    expenseCategories: [
      "GROCERIES",
      "TRANSPORT",
      "UTILITIES",
      "ENTERTAINMENT",
      "HEALTH",
      "EDUCATION",
      "CLOTHING",
      "TRAVEL",
    ],

    // Категории ДОХОДОВ (только поступления)
    incomeCategories: ["SALARY", "INVESTMENTS", "GIFT"],
  };

  // Состояние приложения
  const state = {
    currentCurrency: config.currencies[0],
    budgetData: {
      expenses: [], // Только расходы
      income: [], // Только доходы
    },
    currentMonth: "",
    isLoading: false,
    notifications: [],
    chartType: "limits",
    activeTab: "expenses",
  };

  const tabButtons = document.querySelectorAll(".tab-btn");
  const expenseTab = document.querySelector(".expenses-tab");
  const incomeTab = document.querySelector(".income-tab");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Удаляем активный класс у всех кнопок
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Добавляем активный класс текущей кнопке
      this.classList.add("active");

      // Определяем, какую вкладку показывать
      if (this.dataset.tab === "expenses") {
        expenseTab.style.display = "block";
        incomeTab.style.display = "none";
      } else {
        expenseTab.style.display = "none";
        incomeTab.style.display = "block";
      }
    });
  });

  document
    .querySelector('.tab-btn[data-tab="expenses"]')
    .classList.add("active");
  expenseTab.style.display = "block";
  incomeTab.style.display = "none";

  // Элементы DOM
  const elements = {
    expenseCategories: document.querySelector(".expense-categories"),
    incomeCategories: document.querySelector(".income-categories"),
    expenseCategoryModal: document.getElementById("expense-category-modal"),
    categorySelect: document.getElementById("category-select"),
    categoryLimit: document.getElementById("category-limit"),
    saveCategoryBtn: document.getElementById("save-category"),
    cancelCategoryBtn: document.getElementById("cancel-category"),
    closeModalBtn: document.querySelector(".close-modal"),
    currencyToggle: document.getElementById("currency-toggle"),
    monthSelect: document.getElementById("month-select"),
    // exportReportBtn: document.getElementById("export-report"),
    notificationBadge: document.querySelector(".notification-badge"),
    notificationsDropdown: document.querySelector(".notifications-dropdown"),
    statValues: document.querySelectorAll(".stat-value"),
    notification: document.getElementById("notification"),
    tabBtns: document.querySelectorAll(".tab-btn"),
    chartToggleBtns: document.querySelectorAll(".chart-toggle-btn"),
    budgetChart: null,
  };

  // Инициализация приложения
  initApp();

  // Основные функции
  async function initApp() {
    setupEventListeners();
    await populateMonths();
    await loadBudgetData();

    // Инициализация графика
    initChart();
    updateChart();

    // Инициализируем начальное состояние табов
    document
      .querySelector('.tab-btn[data-tab="expenses"]')
      .classList.add("active");
    document.querySelector(".expenses-tab").style.display = "block";
    document.querySelector(".income-tab").style.display = "none";
    state.activeTab = "expenses";
  }

  async function populateMonths() {
    const months = [];
    const date = new Date();

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const value = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = monthDate
        .toLocaleDateString("ru-RU", {
          month: "long",
          year: "numeric",
        })
        .replace(" г.", "");

      months.push({ value, label });

      if (i === 0) {
        state.currentMonth = value;
      }
    }

    elements.monthSelect.innerHTML = "";
    months.forEach((month) => {
      const option = document.createElement("option");
      option.value = month.value;
      option.textContent = month.label;
      if (month.value === state.currentMonth) {
        option.selected = true;
      }
      elements.monthSelect.appendChild(option);
    });
  }

  async function loadBudgetData() {
    showLoading();
    try {
      if (state.budgetChart) {
        state.budgetChart.destroy();
        state.budgetChart = null;
      }

      const [expensesRes, incomeRes] = await Promise.all([
        fetch(`${config.apiBaseUrl}?month=${state.currentMonth}&type=expense`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }),
        fetch(`${config.transactionUrl}?month=${state.currentMonth}&type=income`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }),
      ]);

      if (!expensesRes.ok || !incomeRes.ok) throw new Error("Ошибка загрузки бюджета");

      // Обработка расходов (без изменений)
      const expensesData = (await expensesRes.json()).filter(item => 
        config.expenseCategories.includes(item.category)
      );

      // Новая обработка доходов - без дублирования
      const rawIncomeData = await incomeRes.json();
      console.log("Raw income data from API:", rawIncomeData); // Для отладки
      
      const incomeData = rawIncomeData
        .filter(item => config.incomeCategories.includes(item.category) || 
              item.category === "OTHER" || item.category === "Другое")
        .reduce((acc, item) => {
          const normalizedCategory = 
            item.category === "OTHER" || item.category === "Другое" 
              ? "OTHER_INCOME" 
              : item.category;
              
          if (!acc[normalizedCategory]) {
            acc[normalizedCategory] = { 
              category: normalizedCategory,
              amount: 0 
            };
          }
          acc[normalizedCategory].amount += item.amount;
          return acc;
        }, {});

      console.log("Processed income data:", incomeData); // Для отладки

      state.budgetData = {
        expenses: expensesData.map(item => ({
          ...item,
          isOverLimit: item.limit > 0 && item.spent > item.limit,
          progressPercentage: item.limit > 0 ? Math.min(100, (item.spent / item.limit) * 100) : 0,
          remaining: item.limit > 0 ? item.limit - item.spent : 0
        })),
        income: Object.values(incomeData)
      };

      renderCategories();
      initChart();
      updateChart();
    } catch (error) {
      console.error("Budget load error:", error);
      showNotification("Не удалось загрузить данные бюджета", "error");
      state.budgetData = { expenses: [], income: [] };
      showEmptyState();
    } finally {
      hideLoading();
    }
  }

  function renderCategories() {
    renderExpenseCategories();
    renderIncomeCategories();
    updateStats();

    // Управление видимостью вкладок
    document.querySelector(".expenses-tab").style.display =
      state.activeTab === "expenses" ? "block" : "none";
    document.querySelector(".income-tab").style.display =
      state.activeTab === "income" ? "block" : "none";
  }

  function renderIncomeCategories() {
  elements.incomeCategories.innerHTML = "";

  if (state.budgetData.income.length === 0) {
    elements.incomeCategories.innerHTML = `
      <div class="empty-state">
        <i class="bx bx-money"></i>
        <p>Нет данных о доходах за выбранный период</p>
      </div>
    `;
    return;
  }

  // Сортируем доходы по сумме (от большего к меньшему)
  const sortedIncome = [...state.budgetData.income].sort((a, b) => b.amount - a.amount);

  sortedIncome.forEach((item, index) => {
    const categoryEl = document.createElement("div");
    categoryEl.className = "budget-category income-category";
    
    const icon = config.categoryIcons[item.category] || "bx-coin";
    const name = config.categoryNames[item.category] || item.category;

    categoryEl.innerHTML = `
      <div class="category-icon income">
        <i class="bx ${icon}"></i>
      </div>
      <div class="category-info income">
        <div class="category-name">${name}</div>
        <div class="income-progress">
          <div class="progress-bar" style="width: 100%; background: ${
            config.colors[index % config.colors.length]
          }"></div>
        </div>
      </div>
      <div class="category-amount income">
        <span class="amount-value">${formatCurrency(item.amount)}</span>
      </div>
    `;

    elements.incomeCategories.appendChild(categoryEl);
  });
}

// Новая функция для получения подписи к доходу
function getIncomeLabel(category) {
  const labels = {
    SALARY: "Зарплата",
    INVESTMENTS: "Инвестиции",
    GIFT: "Подарок",
    OTHER_INCOME: "Поступление"
  };
  return labels[category] || "Доход";
}

  // Исправленная функция отрисовки расходов
  function renderExpenseCategories() {
    elements.expenseCategories.innerHTML = "";

    if (state.budgetData.expenses.length === 0) {
      elements.expenseCategories.innerHTML = `
        <div class="empty-state">
          <i class="bx bx-wallet"></i>
          <p>Добавьте категории расходов для отслеживания бюджета</p>
        </div>
      `;
      return;
    }

    state.budgetData.expenses.forEach((item, index) => {
      // Проверяем, что категория есть в списке расходов
      if (!config.expenseCategories.includes(item.category)) return;

      const progressClass = item.isOverLimit
        ? "danger"
        : item.progressPercentage >= 85
        ? "warning"
        : "success";

      const categoryEl = document.createElement("div");
      categoryEl.className = `budget-category ${
        item.isOverLimit ? "over-limit" : ""
      }`;

      categoryEl.innerHTML = `
        <div class="category-icon">
          <i class="bx ${
            config.categoryIcons[item.category] || "bx-category"
          }"></i>
        </div>
        <div class="category-info">
          <div class="category-name">${
            config.categoryNames[item.category] || item.category
          }</div>
          <div class="category-progress">
            <div class="category-progress-bar ${progressClass}" 
                 style="width: ${Math.min(100, item.progressPercentage)}%;
                 background: ${config.colors[index % config.colors.length]}">
            </div>
          </div>
        </div>
        <div class="category-amount">
          <input type="number" class="category-limit" value="${item.limit}" 
                 data-category="${item.category}" min="0" step="100">
          <div class="category-spent">Потрачено: ${formatCurrency(
            item.spent
          )}</div>
          <div class="category-remaining">Остаток: ${formatCurrency(
            item.remaining
          )}</div>
          <div class="category-remove"><i class="bx bx-trash"></i></div>
        </div>
      `;

      elements.expenseCategories.appendChild(categoryEl);
    });
  }

  function createCategoryElement(item, index, isExpense) {
    const categoryEl = document.createElement("div");
    categoryEl.className = `budget-category ${
      item.isOverLimit ? "over-limit" : ""
    }`;

    if (isExpense) {
      // Логика для расходов (с лимитами и прогрессом)
      const progressClass = item.isOverLimit
        ? "danger"
        : item.progressPercentage >= 85
        ? "warning"
        : "success";

      categoryEl.innerHTML = `
        <div class="category-icon">
          <i class="bx ${config.categoryIcons[item.category]}"></i>
        </div>
        <div class="category-info">
          <div class="category-name">${
            config.categoryNames[item.category]
          }</div>
          <div class="category-progress">
            <div class="category-progress-bar ${progressClass}" 
                 style="width: ${Math.min(100, item.progressPercentage)}%;
                 background: ${config.colors[index % config.colors.length]}">
            </div>
          </div>
        </div>
        <div class="category-amount">
          <input type="number" class="category-limit" value="${item.limit}" 
                 data-category="${item.category}" min="0" step="100">
          <div class="category-spent">Потрачено: ${formatCurrency(
            item.spent
          )}</div>
          <div class="category-remaining">Остаток: ${formatCurrency(
            item.remaining
          )}</div>
          <div class="category-remove"><i class="bx bx-trash"></i></div>
        </div>
      `;
    } else {
      // Логика для доходов (просто отображение суммы)
      categoryEl.innerHTML = `
        <div class="category-icon">
          <i class="bx ${config.categoryIcons[item.category]}"></i>
        </div>
        <div class="category-info">
          <div class="category-name">${
            config.categoryNames[item.category]
          }</div>
        </div>
        <div class="category-amount income">
          ${formatCurrency(item.amount)}
        </div>
      `;
    }

    return categoryEl;
  }

  async function saveBudgetLimit(category, limit) {
    showLoading();
    try {
      const response = await fetch(`${config.apiBaseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          category: category,
          limit: parseFloat(limit),
          month: state.currentMonth, // Формат "YYYY-MM"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка сохранения");
      }

      return await response.json();
    } catch (error) {
      showNotification(error.message, "error");
      throw error;
    } finally {
      hideLoading();
    }
  }

  async function removeBudgetLimit(category) {
    showLoading();
    try {
      const response = await fetch(
        `${config.apiBaseUrl}?category=${category}&month=${state.currentMonth}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Ошибка удаления");
    } catch (error) {
      showNotification("Не удалось удалить лимит", "error");
      throw error;
    } finally {
      hideLoading();
    }
  }

  function updateStats() {
    const stats = {
      inBudget: 0,
      exceeded: 0,
      savings: 0,
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      otherIncome: 0
    };

    // Только расходы - считаем как было
    state.budgetData.expenses.forEach(item => {
      const spent = item.spent || 0;
      stats.totalExpenses += spent;
      
      if (item.limit > 0) {
        if (item.isOverLimit) {
          stats.exceeded++;
        } else {
          stats.inBudget++;
          stats.savings += item.remaining || 0;
        }
      }
    });

    // Доходы - просто суммируем amount из уже обработанных данных
    state.budgetData.income.forEach(item => {
      stats.totalIncome += item.amount || 0;
      if (item.category === "OTHER_INCOME") {
        stats.otherIncome += item.amount || 0;
      }
    });

    stats.balance = stats.totalIncome - stats.totalExpenses;

    // Обновляем DOM
    elements.statValues[0].textContent = stats.inBudget;
    elements.statValues[1].textContent = stats.exceeded;
    elements.statValues[2].textContent = formatCurrency(stats.savings);
    elements.statValues[3].textContent = formatCurrency(stats.totalIncome);
    
    console.log("Calculated stats:", stats); // Для отладки
  }
  function initChart() {
    // Уничтожаем предыдущий график, если он существует
    if (state.budgetChart) {
      state.budgetChart.destroy();
      state.budgetChart = null;
    }

    // Создаем canvas, если его нет
    if (!document.getElementById("budgetChart")) {
      document.querySelector(".chart-container").innerHTML =
        '<canvas id="budgetChart"></canvas>';
    }

    const ctx = document.getElementById("budgetChart").getContext("2d");
    state.budgetChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: config.colors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 16,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${formatCurrency(context.raw)}`;
              },
            },
          },
        },
        animation: {
          animateScale: true,
          animateRotate: true,
        },
      },
    });
  }

  function setupChartToggle() {
    document.querySelectorAll(".chart-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        // Удаляем активный класс у всех кнопок
        document
          .querySelectorAll(".chart-toggle-btn")
          .forEach((b) => b.classList.remove("active"));

        // Добавляем активный класс текущей кнопке
        this.classList.add("active");

        // Обновляем тип графика
        state.chartType = this.dataset.type;

        // Показываем canvas перед обновлением
        if (state.budgetChart) {
          state.budgetChart.canvas.style.display = "block";
        }

        // Обновляем график
        updateChart();
      });
    });
  }

  function updateChart() {
    if (!state.budgetChart) {
      initChart();
    }

    // Показываем canvas
    if (state.budgetChart.canvas) {
      state.budgetChart.canvas.style.display = "block";
    }

    // Убираем сообщение об отсутствии данных если оно есть
    const emptyState = document.querySelector(".empty-chart-state");
    if (emptyState) {
      emptyState.remove();
    }

    let labels = [];
    let data = [];
    let hasData = false;

    // Всегда работаем только с расходами для графика
    state.budgetData.expenses.forEach((item, index) => {
      const value = state.chartType === "limits" ? item.limit : item.spent;
      if (value > 0) {
        labels.push(config.categoryNames[item.category] || item.category);
        data.push(value);
        hasData = true;
      }
    });

    if (!hasData) {
      showEmptyState();
      return;
    }

    // Обновляем данные графика
    state.budgetChart.data.labels = labels;
    state.budgetChart.data.datasets[0].data = data;
    state.budgetChart.data.datasets[0].backgroundColor = labels.map(
      (_, index) => config.colors[index % config.colors.length]
    );

    try {
      state.budgetChart.update();
    } catch (error) {
      console.error("Ошибка обновления графика:", error);
      showEmptyState();
    }
  }

  function showEmptyState() {
    const chartContainer = document.querySelector(".chart-container");
    const emptyText =
      state.chartType === "limits"
        ? "Нет установленных лимитов"
        : "Нет данных о расходах";

    // Создаем элемент для пустого состояния если его нет
    let emptyState = chartContainer.querySelector(".empty-chart-state");
    if (!emptyState) {
      emptyState = document.createElement("div");
      emptyState.className = "empty-chart-state";
      emptyState.innerHTML = `
      <i class="bx bx-pie-chart-alt"></i>
      <p>${emptyText}</p>
    `;
      chartContainer.appendChild(emptyState);
    }

    // Скрываем canvas но не удаляем его
    if (state.budgetChart?.canvas) {
      state.budgetChart.canvas.style.display = "none";
    }
  }

  function updateNotifications() {
    elements.notificationBadge.textContent = state.notifications.length;

    if (state.notifications.length === 0) {
      elements.notificationsDropdown.innerHTML =
        '<div class="notification-item"><p>Нет новых уведомлений</p></div>';
      return;
    }

    elements.notificationsDropdown.innerHTML = "";
    state.notifications.forEach((notification) => {
      const notificationItem = document.createElement("div");
      notificationItem.className = `notification-item ${
        notification.isExceeded ? "danger" : "warning"
      }`;
      notificationItem.innerHTML = `
                <i class="bx ${
                  notification.isExceeded ? "bx-error" : "bx-wallet"
                }"></i>
                <p>${notification.message}</p>
            `;
      elements.notificationsDropdown.appendChild(notificationItem);
    });
  }

  function populateCategorySelect() {
    elements.categorySelect.innerHTML =
      '<option value="">Выберите категорию</option>';

    // Только расходные категории, которые еще не имеют лимита
    const availableCategories = config.expenseCategories.filter(
      (category) =>
        !state.budgetData.expenses.some((item) => item.category === category)
    );

    availableCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = config.categoryNames[category];
      elements.categorySelect.appendChild(option);
    });
  }

  // Вспомогательные функции
  function formatCurrency(value) {
    if (isNaN(value)) {
      console.error("Некорректное значение для форматирования:", value);
      return "0,00 ₽";
    }

    const convertedValue = value * state.currentCurrency.rate;
    return (
      new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedValue) + ` ${state.currentCurrency.symbol}`
    );
  }

  function toggleCurrency() {
    const currentIndex = config.currencies.findIndex(
      (c) => c.code === state.currentCurrency.code
    );
    const nextIndex = (currentIndex + 1) % config.currencies.length;
    state.currentCurrency = config.currencies[nextIndex];
    elements.currencyToggle.textContent = state.currentCurrency.symbol;
    renderCategories();
    updateChart();
  }

  function showNotification(message, type = "success") {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.remove("hidden");

    setTimeout(() => {
      elements.notification.classList.add("hidden");
    }, 3000);
  }

  function showLoading() {
    state.isLoading = true;
    document.body.classList.add("loading");
  }

  function hideLoading() {
    state.isLoading = false;
    document.body.classList.remove("loading");
  }

  function closeModal() {
    elements.expenseCategoryModal.classList.remove("active");
    elements.categorySelect.value = "";
    elements.categoryLimit.value = "";
  }

  function switchTab(tabName) {
    if (state.activeTab === tabName) return;

    state.activeTab = tabName;
    elements.tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Обновляем только список категорий
    renderCategories();
  }

  function switchChartType(type) {
    if (state.chartType === type) return;

    state.chartType = type;
    elements.chartToggleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type);
    });

    // Всегда обновляем график, независимо от активного таба
    updateChart();
  }

  // Обработчики событий
  function setupEventListeners() {
    // Открытие модального окна для добавления категории расходов

    // Закрытие модального окна
    elements.cancelCategoryBtn.addEventListener("click", closeModal);

    // Сохранение категории расходов
    elements.saveCategoryBtn.addEventListener("click", async () => {
      const category = elements.categorySelect.value;
      const limit = parseFloat(elements.categoryLimit.value);

      if (!category) {
        showNotification("Выберите категорию", "error");
        return;
      }

      if (isNaN(limit) || limit <= 0) {
        showNotification("Введите корректную сумму лимита", "error");
        return;
      }

      try {
        await saveBudgetLimit(category, limit);
        showNotification("Лимит успешно сохранен", "success");
        closeModal();
        await loadBudgetData();
      } catch (error) {
        console.error("Save error:", error);
      }
    });

    // Переключение валюты
    elements.currencyToggle.addEventListener("click", toggleCurrency);

    // Изменение месяца
    elements.monthSelect.addEventListener("change", async function () {
      state.currentMonth = this.value;
      await loadBudgetData();
    });

    // Удаление категории расходов
    elements.expenseCategories.addEventListener("click", async function (e) {
      if (e.target.closest(".category-remove")) {
        const categoryEl = e.target.closest(".budget-category");
        const categoryName =
          categoryEl.querySelector(".category-limit").dataset.category;

        try {
          await removeBudgetLimit(categoryName);
          showNotification("Лимит удален", "success");
          await loadBudgetData();
        } catch (error) {
          console.error("Delete error:", error);
        }
      }
    });

    // Изменение лимита категории расходов
    elements.expenseCategories.addEventListener("change", async function (e) {
      if (e.target.classList.contains("category-limit")) {
        const category = e.target.dataset.category;
        const newLimit = parseFloat(e.target.value);

        if (isNaN(newLimit)) {
          showNotification("Введите корректное число", "error");
          return;
        }

        try {
          await saveBudgetLimit(category, newLimit);
          showNotification("Лимит обновлен", "success");
          await loadBudgetData();
        } catch (error) {
          console.error("Update error:", error);
          // Возвращаем старое значение
          const item = state.budgetData.expenses.find(
            (i) => i.category === category
          );
          if (item) e.target.value = item.limit;
        }
      }
    });

    // Переключение табов
    elements.tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        // Удаляем активный класс у всех кнопок
        elements.tabBtns.forEach((b) => b.classList.remove("active"));

        // Добавляем активный класс текущей кнопке
        this.classList.add("active");

        // Обновляем активную вкладку в состоянии
        state.activeTab = this.dataset.tab;

        // Обновляем только список категорий (не график)
        renderCategories();
      });
    });

    // Переключение типа графика
    elements.chartToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchChartType(btn.dataset.type));
    });

    // Экспорт отчета
    // elements.exportReportBtn.addEventListener("click", exportReport);

    // Клик вне модального окна
    window.addEventListener("click", (e) => {
      if (e.target === elements.expenseCategoryModal) {
        closeModal();
      }
    });
  }

  // Экспорт отчета (заглушка)
  function exportReport() {
    const month =
      elements.monthSelect.options[elements.monthSelect.selectedIndex].text;
    showNotification(`Отчет за ${month} будет сгенерирован`, "info");

    // Реальная реализация с jsPDF
    // const { jsPDF } = window.jspdf;
    // const doc = new jsPDF();
    // ...
  }
});
