document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Токен не найден");
    return;
  }

  // Валюта
  const currencies = [
    { code: "RUB", symbol: "₽", rate: 1 },
    { code: "USD", symbol: "$", rate: 0.011 },
    { code: "EUR", symbol: "€", rate: 0.01 },
  ];
  let currentCurrencyIndex = 0;

  // Функция для выполнения запросов к API
  async function fetchData(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `http://localhost:8080${url}${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await fetch(fullUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      throw error;
    }
  }

  // Получаем реальные данные
  async function getRealData() {
    try {
      // 1. Получаем историю баланса
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const balanceHistory = await fetchData("/api/accounts/total-balance-history", {
        startDate: formatDate(firstDayOfMonth),
        endDate: formatDate(lastDayOfMonth)
      });
      
      // 2. Получаем транзакции за текущий месяц
      const transactions = await fetchData("/api/transactions", {
        startDate: formatDate(firstDayOfMonth),
        endDate: formatDate(lastDayOfMonth)
      });
      
      // 3. Анализируем категории расходов
      const expenseCategories = analyzeExpenseCategories(transactions);
      
      // 4. Получаем доходы и расходы
      const incomeExpense = calculateIncomeExpense(transactions);
      
      // Форматируем данные для графиков
      return {
        balanceTrend: await formatBalanceTrend(balanceHistory),
        incomeExpense,
        categories: expenseCategories,
        monthsComparison: await getMonthsComparison()
      };
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      return getFallbackData();
    }
  }

  // Форматирование даты для API (YYYY-MM-DD)
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Анализ категорий расходов
  function analyzeExpenseCategories(transactions) {
    const categoriesMap = {};
    
    const expenses = transactions.filter(t => t.type === "EXPENSE");
    
    expenses.forEach(expense => {
      if (!categoriesMap[expense.category]) {
        categoriesMap[expense.category] = 0;
      }
      categoriesMap[expense.category] += expense.amount;
    });
    
    return Object.entries(categoriesMap)
      .map(([name, amount]) => ({
        name: getCategoryName(name),
        amount,
        color: getCategoryColor(name)
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Расчет доходов и расходов
  function calculateIncomeExpense(transactions) {
    let income = 0;
    let expenses = 0;
    const categories = {};
    
    transactions.forEach(t => {
      if (t.type === "INCOME") {
        income += t.amount;
      } else {
        expenses += t.amount;
        
        if (!categories[t.category]) {
          categories[t.category] = 0;
        }
        categories[t.category] += t.amount;
      }
    });
    
    return {
      all: {
        income,
        expenses,
        net: income - expenses,
        categories
      }
    };
  }

  // Форматирование данных для графика баланса
  async function formatBalanceTrend() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Получаем начальный баланс (на конец предыдущего месяца)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const initialBalanceResponse = await fetchData("/api/accounts/total-balance-history", {
      endDate: formatDate(new Date(firstDayOfMonth.getTime() - 1)),
      limit: 1
    });
    
    let initialBalance = initialBalanceResponse?.[0]?.balance || 0;

    // 2. Получаем все транзакции за текущий месяц
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const transactions = await fetchData("/api/transactions", {
      startDate: formatDate(firstDayOfMonth),
      endDate: formatDate(lastDayOfMonth)
    });

    // 3. Рассчитываем дневные балансы для месяца
    const daysInMonth = lastDayOfMonth.getDate();
    const dailyBalances = [];
    const transactionsByDate = {};

    // Группируем транзакции по датам
    transactions.forEach(t => {
      const date = t.date.split('T')[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = [];
      }
      transactionsByDate[date].push(t);
    });

    // Рассчитываем баланс для каждого дня месяца
    let currentBalance = initialBalance;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      const dateStr = formatDate(date);

      if (transactionsByDate[dateStr]) {
        const dayChange = transactionsByDate[dateStr].reduce((sum, t) => {
          return sum + (t.type === "INCOME" ? t.amount : -t.amount);
        }, 0);
        currentBalance += dayChange;
      }

      dailyBalances.push({
        date: dateStr,
        balance: currentBalance,
        day: day
      });
    }

    // 4. Формируем недельный график (текущая неделя с понедельника по воскресенье)
    const weeklyData = [];
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    // Находим понедельник текущей недели
    const currentDayOfWeek = today.getDay(); // 0-6 (вс-сб)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    // Получаем баланс на начало недели (воскресенье предыдущей недели)
    const weekStartBalanceResponse = await fetchData("/api/accounts/total-balance-history", {
      endDate: formatDate(new Date(monday.getTime() - 1)),
      limit: 1
    });
    let weekBalance = weekStartBalanceResponse?.[0]?.balance || initialBalance;

    // Получаем транзакции за текущую неделю
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekTransactions = await fetchData("/api/transactions", {
      startDate: formatDate(monday),
      endDate: formatDate(sunday)
    });

    // Группируем транзакции по дням недели
    const weekTransactionsByDay = {};
    weekTransactions.forEach(t => {
      const date = new Date(t.date);
      const dayOfWeek = date.getDay(); // 0-6 (вс-сб)
      const weekdayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Преобразуем в пн-вс
      
      if (!weekTransactionsByDay[weekdayIndex]) {
        weekTransactionsByDay[weekdayIndex] = [];
      }
      weekTransactionsByDay[weekdayIndex].push(t);
    });

    // Рассчитываем баланс для каждого дня недели
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      
      if (weekTransactionsByDay[i]) {
        const dayChange = weekTransactionsByDay[i].reduce((sum, t) => {
          return sum + (t.type === "INCOME" ? t.amount : -t.amount);
        }, 0);
        weekBalance += dayChange;
      }

      weeklyData.push({
        label: weekdays[i],
        value: weekBalance,
        date: formatDate(currentDate)
      });
    }

    // 5. Формируем годовой график (с января по текущий месяц)
    const yearlyData = [];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // Текущий месяц (0-11)

    // Получаем начальный баланс на 1 января текущего года
    const januaryFirst = new Date(currentYear, 0, 1);
    const initialYearBalanceResponse = await fetchData("/api/accounts/total-balance-history", {
      endDate: formatDate(new Date(januaryFirst.getTime() - 1)), // Баланс на 31 декабря прошлого года
      limit: 1
    });
    let yearBalance = initialYearBalanceResponse?.[0]?.balance || 0;

    // Получаем ВСЕ транзакции за текущий год
    const yearTransactions = await fetchData("/api/transactions", {
      startDate: formatDate(januaryFirst),
      endDate: formatDate(today)
    });

    // Группируем транзакции по месяцам
    const transactionsByMonth = {};
    yearTransactions.forEach(t => {
      const date = new Date(t.date);
      const month = date.getMonth();
      
      if (!transactionsByMonth[month]) {
        transactionsByMonth[month] = [];
      }
      transactionsByMonth[month].push(t);
    });

    // Рассчитываем баланс для каждого месяца
    for (let month = 0; month <= currentMonth; month++) {
      if (transactionsByMonth[month]) {
        const monthChange = transactionsByMonth[month].reduce((sum, t) => {
          return sum + (t.type === "INCOME" ? t.amount : -t.amount);
        }, 0);
        yearBalance += monthChange;
      }

      const monthDate = new Date(currentYear, month, 1);
      yearlyData.push({
        monthName: monthDate.toLocaleDateString('ru-RU', { month: 'short' }),
        balance: yearBalance,
        month: month
      });
    }

    return {
      week: {
        labels: weeklyData.map(d => d.label),
        data: weeklyData.map(d => d.value)
      },
      month: {
        labels: dailyBalances.map(d => d.day),
        data: dailyBalances.map(d => d.balance)
      },
      year: {
        labels: yearlyData.map(m => m.monthName),
        data: yearlyData.map(m => m.balance)
      }
    };

  } catch (error) {
    console.error("Ошибка формирования графика баланса:", error);
    return getDefaultBalanceTrend();
  }
}

  async function getYearlyBalanceData(endDate) {
    const result = [];
    const currentMonth = endDate.getMonth();
    const currentYear = endDate.getFullYear();

    for (let i = 11; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((i - currentMonth) / 12);
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      try {
        const response = await fetchData("/api/accounts/total-balance-history", {
          endDate: formatDate(lastDay),
          limit: 1
        });
        
        if (response && response.length > 0) {
          result.push({
            date: formatDate(lastDay),
            balance: response[0].balance,
            monthName: firstDay.toLocaleDateString('ru-RU', { month: 'short' })
          });
        } else {
          // Если нет данных, используем 0 или предыдущее значение
          result.push({
            date: formatDate(lastDay),
            balance: result.length > 0 ? result[result.length - 1].balance : 0,
            monthName: firstDay.toLocaleDateString('ru-RU', { month: 'short' })
          });
        }
      } catch (error) {
        console.error(`Ошибка получения данных за ${month + 1}.${year}:`, error);
        // В случае ошибки продолжаем с предыдущим значением
        result.push({
          date: formatDate(lastDay),
          balance: result.length > 0 ? result[result.length - 1].balance : 0,
          monthName: firstDay.toLocaleDateString('ru-RU', { month: 'short' })
        });
      }
    }

    return result;
  }

  // Сравнение с предыдущим месяцем
  async function getMonthsComparison() {
    const currentMonth = new Date();
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Получаем транзакции за текущий месяц
    const currentStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const currentTransactions = await fetchData("/api/transactions", {
      startDate: formatDate(currentStart),
      endDate: formatDate(currentEnd),
      type: "EXPENSE"
    });
    
    // Получаем транзакции за предыдущий месяц
    const prevStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
    const prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    const prevTransactions = await fetchData("/api/transactions", {
      startDate: formatDate(prevStart),
      endDate: formatDate(prevEnd),
      type: "EXPENSE"
    });
    
    // Анализируем категории
    const currentCategories = analyzeExpenseCategories(currentTransactions);
    const prevCategories = analyzeExpenseCategories(prevTransactions);
    
    // Создаем общий список категорий
    const allCategories = [...new Set([
      ...currentCategories.map(c => c.name),
      ...prevCategories.map(c => c.name)
    ])];
    
    // Формируем данные для сравнения
    const currentData = allCategories.map(cat => {
      const found = currentCategories.find(c => c.name === cat);
      return found ? found.amount : 0;
    });
    
    const prevData = allCategories.map(cat => {
      const found = prevCategories.find(c => c.name === cat);
      return found ? found.amount : 0;
    });
    
    return {
      current: currentData,
      previous: prevData,
      labels: allCategories
    };
  }

  // Вспомогательные функции
  function getCategoryName(category) {
    const names = {
      "GROCERIES": "Продукты",
      "TRANSPORT": "Транспорт",
      "UTILITIES": "Жильё",
      "ENTERTAINMENT": "Развлечения",
      "HEALTH": "Здоровье",
      "EDUCATION": "Образование",
      "CLOTHING": "Одежда",
      "TRAVEL": "Путешествия",
      "OTHER_EXPENSE": "Другое",
      "SALARY": "Зарплата",
      "INVESTMENTS": "Инвестиции",
      "GIFT": "Подарки",
      "OTHER_INCOME": "Другие доходы"
    };
    return names[category] || category;
  }

  function getCategoryColor(category) {
    const colors = {
      "GROCERIES": "#2041ff",
      "TRANSPORT": "#2ecc71",
      "UTILITIES": "#e74c3c",
      "ENTERTAINMENT": "#f39c12",
      "HEALTH": "#9b59b6",
      "EDUCATION": "#1abc9c",
      "CLOTHING": "#e67e22",
      "TRAVEL": "#3498db",
      "OTHER_EXPENSE": "#7f8c8d",
      "SALARY": "#27ae60",
      "INVESTMENTS": "#16a085",
      "GIFT": "#8e44ad",
      "OTHER_INCOME": "#2c3e50"
    };
    return colors[category] || "#e7adcd";
  }

  function getFallbackData() {
    console.warn("Используются демо-данные из-за ошибки загрузки");
    return {
      balanceTrend: getDefaultBalanceTrend(),
      incomeExpense: {
        all: {
          income: 85000,
          expenses: 42300,
          net: 42700,
          categories: {
            food: 18450,
            transport: 8700,
            housing: 25000,
          },
        },
      },
      categories: [
        { name: "Продукты", amount: 18450, color: "#2041ff" },
        { name: "Транспорт", amount: 8700, color: "#2ecc71" },
        { name: "Жильё", amount: 25000, color: "#e74c3c" },
        { name: "Развлечения", amount: 5000, color: "#f39c12" },
        { name: "Одежда", amount: 3000, color: "#9b59b6" },
      ],
      monthsComparison: {
        current: [25000, 15000, 40000, 10000, 8000],
        previous: [22000, 12000, 38000, 15000, 5000],
        labels: ["Продукты", "Транспорт", "Жильё", "Развлечения", "Одежда"],
      },
    };
  }

  function getDefaultBalanceTrend() {
    return {
      week: {
        labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
        data: [220000, 225000, 230000, 235000, 240000, 242000, 245780],
      },
      month: {
        labels: ["1-7", "8-14", "15-21", "22-28", "29-31"],
        data: [200000, 215000, 230000, 240000, 245780],
      },
      year: {
        labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        data: [180000, 185000, 190000, 200000, 210000, 220000, 225000, 230000, 235000, 240000, 242000, 245780],
      }
    };
  }

  // Форматирование валюты
  function formatCurrency(value, currency = "RUB") {
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

  // Основная функция инициализации
  async function initialize() {
    try {
      const statsData = await getRealData();
      
      // Инициализация графиков
      if (document.getElementById("balanceTrendChart")) {
        initBalanceTrendChart(statsData);
      }
      
      if (document.getElementById("incomeExpenseChart")) {
        initIncomeExpenseChart(statsData);
        updateIncomeExpenseStats(statsData.incomeExpense.all);
      }
      
      if (document.getElementById("expenseCategoriesChart")) {
        initExpenseCategoriesChart(statsData);
      }
      
      if (document.getElementById("monthComparisonChart")) {
        initMonthComparisonChart(statsData);
      }
      
      initDetailsButtons(statsData);
    } catch (error) {
      console.error("Ошибка инициализации:", error);
    }
  }

  // Функции инициализации графиков
  function initBalanceTrendChart(data) {

    const canvas = document.getElementById("balanceTrendChart");
    if (!canvas) return;

    const ctx = document.getElementById("balanceTrendChart").getContext("2d");
    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.balanceTrend.month.labels,
        datasets: [{
          label: "Общий баланс",
          data: data.balanceTrend.month.data,
          borderColor: "#2041ff",
          backgroundColor: "rgba(32, 65, 255, 0.1)",
          tension: 0.4,
          fill: true,
        }],
      },
      options: getChartOptions("₽"),
    });

    document.getElementById("period-select").addEventListener("change", function() {
      const period = this.value;
      chart.data.labels = data.balanceTrend[period].labels;
      chart.data.datasets[0].data = data.balanceTrend[period].data;
      chart.update();
    });
  }

  function initIncomeExpenseChart(data) {
    const ctx = document.getElementById("incomeExpenseChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Доходы", "Расходы"],
        datasets: [{
          data: [
            data.incomeExpense.all.income,
            -data.incomeExpense.all.expenses,
          ],
          backgroundColor: ["#2ecc71", "#e74c3c"],
          borderRadius: 8,
        }],
      },
      options: getChartOptions("₽", false),
    });
  }

  function updateIncomeExpenseStats(data) {
    const incomeElement = document.querySelector(".stat-item.income .stat-value");
    const expenseElement = document.querySelector(".stat-item.expense .stat-value");
    const netElement = document.querySelector(".stat-item.net .stat-value");

    if (incomeElement) incomeElement.textContent = `+${formatCurrency(data.income)}`;
    if (expenseElement) expenseElement.textContent = `-${formatCurrency(data.expenses)}`;
    if (netElement) netElement.textContent = `${data.net >= 0 ? '+' : ''}${formatCurrency(data.net)}`;
  }

  function initExpenseCategoriesChart(data) {
    const ctx = document.getElementById("expenseCategoriesChart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.categories.map(c => c.name),
        datasets: [{
          data: data.categories.map(c => c.amount),
          backgroundColor: data.categories.map(c => c.color),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: "70%",
      },
    });
  }

  function initMonthComparisonChart(data) {
    const ctx = document.getElementById("monthComparisonChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.monthsComparison.labels,
        datasets: [
          {
            label: "Текущий месяц",
            data: data.monthsComparison.current,
            backgroundColor: "#2041ff",
            borderRadius: 4,
          },
          {
            label: "Прошлый месяц",
            data: data.monthsComparison.previous,
            backgroundColor: "#a0c4da",
            borderRadius: 4,
          },
        ],
      },
      options: getChartOptions("₽"),
    });
  }

  function initDetailsButtons(data) {
    document.querySelectorAll(".details-btn").forEach((btn) => {
      btn.addEventListener("click", function() {
        const targetId = this.dataset.target;
        const card = this.closest(".scrollable-card");
        const chartContainer = card.querySelector(".progress-chart");
        
        card.classList.toggle("active");
        
        if (card.classList.contains("active") && !card.dataset.loaded) {
          loadDetailsData(targetId, data);
          card.dataset.loaded = "true";
          
          // Пересчитываем размеры графиков после загрузки данных
          setTimeout(() => {
            if (window.myCharts && window.myCharts[targetId]) {
              window.myCharts[targetId].resize();
            }
          }, 300);
        }
        
        // Обновляем иконку и текст
        const icon = this.querySelector("i");
        if (card.classList.contains("active")) {
          icon.style.transform = "rotate(90deg)";
          this.querySelector("span").textContent = "Скрыть";
          // Увеличиваем высоту карточки
          card.style.transition = "height 0.3s ease";
        } else {
          icon.style.transform = "rotate(0deg)";
          this.querySelector("span").textContent = "Детали";
        }
        
        // Обновляем размеры графиков
        if (chartContainer && chartContainer.chart) {
          setTimeout(() => {
            chartContainer.chart.resize();
          }, 10);
        }
      });
    });
  }

  function loadDetailsData(targetId, data) {
    if (targetId === "monthComparisonDetails") {
      const tbody = document.querySelector(`#${targetId} tbody`);
      tbody.innerHTML = data.monthsComparison.labels
        .map((label, i) => `
          <tr>
            <td>${label}</td>
            <td>${formatCurrency(data.monthsComparison.current[i])}</td>
            <td>${formatCurrency(data.monthsComparison.previous[i])}</td>
            <td class="${data.monthsComparison.current[i] >= data.monthsComparison.previous[i] ? "positive" : "negative"}">
              ${formatCurrency(Math.abs(data.monthsComparison.current[i] - data.monthsComparison.previous[i]))}
            </td>
          </tr>
        `).join("");
    } else if (targetId === "categoriesDetails") {
      const container = document.querySelector(`#${targetId} .categories-list`);
      container.innerHTML = data.categories
        .map(category => `
          <div class="category-item">
            <div class="category-color" style="background: ${category.color};"></div>
            <span class="category-name">${category.name}</span>
            <span class="category-amount">-${formatCurrency(category.amount)}</span>
            <span class="category-percent">${Math.round((category.amount / data.incomeExpense.all.expenses) * 100)}%</span>
          </div>
        `).join("");
    }
  }

  function getChartOptions(currencySymbol, showLegend = true) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: showLegend },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label || ""}: ${Math.abs(context.raw).toLocaleString("ru-RU")} ${currencySymbol}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: value => value.toLocaleString("ru-RU") + " " + currencySymbol,
          },
        },
      },
    };
  }

  async function calculateFinancialHealth(data) {
    try {
      // 1. Получаем доходы и расходы за последние 3 месяца для более точной оценки
      const today = new Date();
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      
      const transactions = await fetchData("/api/transactions", {
        startDate: formatDate(threeMonthsAgo),
        endDate: formatDate(today)
      });
      
      // 2. Рассчитываем среднемесячные показатели
      const monthlyData = {};
      
      // Группируем по месяцам
      transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, savings: 0 };
        }
        
        if (t.type === "INCOME") {
          monthlyData[monthKey].income += t.amount;
        } else {
          monthlyData[monthKey].expenses += t.amount;
        }
      });
      
      // Рассчитываем сбережения (разница между доходами и расходами)
      Object.keys(monthlyData).forEach(month => {
        monthlyData[month].savings = monthlyData[month].income - monthlyData[month].expenses;
      });
      
      // 3. Рассчитываем показатели здоровья
      const monthsCount = Object.keys(monthlyData).length;
      const avgIncome = Object.values(monthlyData).reduce((sum, m) => sum + m.income, 0) / monthsCount;
      const avgExpenses = Object.values(monthlyData).reduce((sum, m) => sum + m.expenses, 0) / monthsCount;
      const avgSavings = Object.values(monthlyData).reduce((sum, m) => sum + m.savings, 0) / monthsCount;
      
      // Показатель сбережений (0-100%)
      const savingsRate = Math.min(100, Math.max(0, Math.round((avgSavings / avgIncome) * 100)));
      
      // Показатель соотношения расходов к доходам (чем меньше, тем лучше)
      const expenseRatio = Math.min(100, Math.max(0, Math.round((avgExpenses / avgIncome) * 100)));
      // Инвертируем для отображения (чем больше %, тем лучше)
      const expenseHealth = 100 - expenseRatio;
      
      return {
        savingsRate,
        expenseHealth,
        avgIncome,
        avgExpenses,
        avgSavings
      };
    } catch (error) {
      console.error("Ошибка расчета финансового здоровья:", error);
      return {
        savingsRate: 75,
        expenseHealth: 35,
        avgIncome: 85000,
        avgExpenses: 55000,
        avgSavings: 30000
      };
    }
  }

  // Обновляем функцию initialize()
  async function initialize() {
    try {
      const statsData = await getRealData();
      const healthData = await calculateFinancialHealth(statsData);
      
      // Инициализация графиков
      if (document.getElementById("balanceTrendChart")) {
        initBalanceTrendChart(statsData);
      }
      
      if (document.getElementById("incomeExpenseChart")) {
        initIncomeExpenseChart(statsData);
        updateIncomeExpenseStats(statsData.incomeExpense.all);
      }
      
      if (document.getElementById("expenseCategoriesChart")) {
        initExpenseCategoriesChart(statsData);
      }
      
      if (document.getElementById("monthComparisonChart")) {
        initMonthComparisonChart(statsData);
      }
      
      // Обновляем показатели финансового здоровья
      updateFinancialHealth(healthData);
      
      initDetailsButtons(statsData);

      window.addEventListener('resize', function() {
        document.querySelectorAll('.progress-chart').forEach(container => {
          if (container.chart) {
            setTimeout(() => {
              container.chart.resize();
            }, 100);
          }
        });
      });
    } catch (error) {
      console.error("Ошибка инициализации:", error);
    }
  }

  // Добавляем эту функцию для обновления UI
  function updateFinancialHealth(data) {
    // Обновляем круговые прогрессы
    document.querySelectorAll('.circular-progress').forEach(progress => {
      const value = progress.dataset.value;
      const path = progress.querySelector('.progress-bar');
      if (path) {
        path.setAttribute('stroke-dasharray', `${value}, 100`);
      }
      const valueText = progress.querySelector('.progress-value');
      if (valueText) {
        valueText.textContent = `${value}%`;
      }
    });

    // Обновляем текстовую информацию
    const savingsMetric = document.querySelector('.metric-item:nth-child(1) .metric-info');
    if (savingsMetric) {
      savingsMetric.querySelector('h3').textContent = 'Сбережения';
      savingsMetric.querySelector('p').textContent = 
        `Откладываете ${Math.round(data.avgSavings/data.avgIncome*100)}% от доходов`;
      savingsMetric.querySelector('.range-fill').style.width = `${data.savingsRate}%`;
      
      // Обновляем значение в data-атрибуте для анимации
      const savingsProgress = document.querySelector('.metric-item:nth-child(1) .circular-progress');
      if (savingsProgress) {
        savingsProgress.dataset.value = data.savingsRate;
        savingsProgress.querySelector('.progress-bar').setAttribute('stroke-dasharray', `${data.savingsRate}, 100`);
        savingsProgress.querySelector('.progress-value').textContent = `${data.savingsRate}%`;
      }
    }

    const expenseMetric = document.querySelector('.metric-item:nth-child(2) .metric-info');
    if (expenseMetric) {
      expenseMetric.querySelector('h3').textContent = 'Соотношение';
      expenseMetric.querySelector('p').textContent = 
        `Расходы составляют ${Math.round(data.avgExpenses/data.avgIncome*100)}% от доходов`;
      expenseMetric.querySelector('.range-fill').style.width = `${data.expenseHealth}%`;
      
      // Обновляем значение в data-атрибуте для анимации
      const expenseProgress = document.querySelector('.metric-item:nth-child(2) .circular-progress');
      if (expenseProgress) {
        expenseProgress.dataset.value = data.expenseHealth;
        expenseProgress.querySelector('.progress-bar').setAttribute('stroke-dasharray', `${data.expenseHealth}, 100`);
        expenseProgress.querySelector('.progress-value').textContent = `${data.expenseHealth}%`;
      }
    }
  }

  // Запуск инициализации
  initialize();
});