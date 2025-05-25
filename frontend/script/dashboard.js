document.addEventListener("DOMContentLoaded", async function () {
  // Конфигурация API
  const API_BASE_URL = "http://localhost:8080/api";
  const token = localStorage.getItem("token");
  
  if (!token) {
    window.location.href = "/frontend/sign-in.html";
    return;
  }

  // Валюта
  const currencies = [
    { code: "RUB", symbol: "₽", rate: 1 },
    { code: "USD", symbol: "$", rate: 0.011 },
    { code: "EUR", symbol: "€", rate: 0.01 },
  ];
  let currentCurrency = currencies[0];

  // Функция для выполнения запросов к API
  async function fetchData(url, options = {}) {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
      };

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        window.location.href = "/frontend/sign-in.html";
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Ошибка запроса");
      }

      return await response.json();
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      throw error;
    }
  }

  function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  async function initRecentTransactions() {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      // Получаем все транзакции за неделю и сортируем по дате (новые сначала)
      const transactions = await fetchData(
        `/transactions?startDate=${formatDateForAPI(weekAgo)}&endDate=${formatDateForAPI(today)}`
      );
      
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
      
      const container = document.querySelector('.recent-transactions');
      
      if (recentTransactions.length === 0) {
        container.innerHTML = `
          <div class="no-data-message">
            <i class="bx bx-time"></i>
            <p>Нет транзакций за последнюю неделю</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item" data-original-amount="${transaction.amount}">
          <div class="transaction-icon ${transaction.type.toLowerCase()}">
            <i class="bx ${transaction.type === 'INCOME' ? 'bx-trending-up' : 'bx-trending-down'}"></i>
          </div>
          <div class="transaction-details">
            <div class="transaction-info">
              <span class="transaction-category">${getCategoryName(transaction.category)}</span>
              <span class="transaction-date">${formatDisplayDate(transaction.date)}</span>
            </div>
            <div class="transaction-amount ${transaction.type.toLowerCase()}">
              ${transaction.type === 'INCOME' ? '+' : '-'}${formatCurrency(transaction.amount, currentCurrency.code)}
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Ошибка загрузки последних транзакций:', error);
      const container = document.querySelector('.recent-transactions');
      container.innerHTML = `
        <div class="no-data-message error">
          <i class="bx bx-error-circle"></i>
          <p>Не удалось загрузить транзакции</p>
        </div>
      `;
    }
  }


  async function initUpcomingPayments() {
    try {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      const payments = await fetchData(
        `/transactions?startDate=${formatDateForAPI(today)}&endDate=${formatDateForAPI(nextMonth)}&type=EXPENSE`
      );
      
      // Фильтруем только будущие платежи
      const upcoming = payments.filter(p => new Date(p.date) > today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
      
      const container = document.querySelector('.upcoming-payments');
      
      if (upcoming.length === 0) {
        container.innerHTML = `
          <div class="no-data-message">
            <i class="bx bx-calendar-check"></i>
            <p>Нет предстоящих платежей в этом месяце</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = upcoming.map(payment => `
        <div class="payment-item" data-original-amount="${payment.amount}">
          <div class="payment-icon">
            <i class="${getPaymentIcon(payment.category)}"></i>
          </div>
          <div class="payment-details">
            <div class="payment-info">
              <span class="payment-title">${getCategoryName(payment.category)}</span>
              <span class="payment-date">${formatDisplayDate(payment.date)}</span>
            </div>
            <div class="payment-amount">
              -${formatCurrency(payment.amount, currentCurrency.code)}
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Ошибка загрузки предстоящих платежей:', error);
      const container = document.querySelector('.upcoming-payments');
      container.innerHTML = `
        <div class="no-data-message error">
          <i class="bx bx-error-circle"></i>
          <p>Не удалось загрузить платежи</p>
        </div>
      `;
    }
  }

  function getPaymentIcon(category) {
    const icons = {
      'GROCERIES': 'bx bx-shopping-bag',
      'TRANSPORT': 'bx bx-car',
      'UTILITIES': 'bx bx-home',
      'ENTERTAINMENT': 'bx bx-movie-play',
      'HEALTH': 'bx bx-plus-medical',
      'EDUCATION': 'bx bx-book',
      'CLOTHING': 'bx bx-t-shirt',
      'TRAVEL': 'bx bx-plane',
      'OTHER': 'bx bx-money',
      'SALARY': 'bx bx-credit-card',
      'INVESTMENTS': 'bx bx-trending-up',
      'GIFT': 'bx bx-gift',
      'OTHER_INCOME': 'bx bx-dollar-circle'
    };
    return icons[category] || 'bx bx-money';
  }

  function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(value, currency = "RUB") {
    const formatter = new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formatted = formatter.format(value * (currency === "RUB" ? 1 : currentCurrency.rate));

    switch (currency) {
      case "USD":
        return formatted + " $";
      case "EUR":
        return formatted + " €";
      default:
        return formatted + " ₽";
    }
  }

  // Получение данных с бэкенда
  async function loadDashboardData() {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const [accounts, balance, transactions, goals, balanceHistory] = await Promise.all([
        fetchData("/accounts"),
        fetchData("/accounts/total-balance"),
        fetchData(`/transactions?startDate=${formatDateForAPI(firstDayOfMonth)}&endDate=${formatDateForAPI(lastDayOfMonth)}`),
        fetchData("/goals"),
        fetchWeeklyBalanceHistory(today)
      ]);

      const expenseCategories = analyzeExpenseCategories(transactions);
      const weeklyIncomeExpense = calculateWeeklyIncomeExpense(transactions, balanceHistory.monday, balanceHistory.sunday);

      return {
        balanceData: {
          total: balance.totalBalance,
          accounts: accounts.map(account => ({
            name: account.displayName || getPaymentMethodDisplayName(account.paymentMethod),
            amount: account.balance
          }))
        },
        weeklyProgress: formatWeeklyProgressData(balanceHistory.data, balanceHistory.labels),
        transactions: formatWeeklyTransactionsData(weeklyIncomeExpense),
        monthlyStats: formatMonthlyStatsData(expenseCategories),
        goals: goals.map(goal => ({
          title: goal.name,
          current: goal.currentAmount,
          target: goal.targetAmount
        })),
        motivators: getMotivationalMessages(balance.totalBalance, goals),
        rawTransactions: transactions.slice(0, 3) 
      };
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      return getFallbackData();
    }
  }

  async function fetchWeeklyBalanceHistory(today) {
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStartBalance = await fetchData(
      `/accounts/total-balance-history?endDate=${formatDateForAPI(new Date(monday.getTime() - 1))}&limit=1`
    );

    const weekTransactions = await fetchData(
      `/transactions?startDate=${formatDateForAPI(monday)}&endDate=${formatDateForAPI(sunday)}`
    );

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const balanceData = [];
    let currentBalance = weekStartBalance[0]?.balance || 0;
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      
      const dayTransactions = weekTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDate() === currentDate.getDate() && 
               tDate.getMonth() === currentDate.getMonth();
      });

      if (dayTransactions.length > 0) {
        const dayChange = dayTransactions.reduce((sum, t) => {
          return sum + (t.type === "INCOME" ? t.amount : -t.amount);
        }, 0);
        currentBalance += dayChange;
      }

      balanceData.push(currentBalance);
    }

    return {
      data: balanceData,
      labels: weekdays,
      monday,
      sunday
    };
  }

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

  function calculateWeeklyIncomeExpense(transactions, startDate, endDate) {
    const incomeData = Array(7).fill(0);
    const expenseData = Array(7).fill(0);

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      if (transactionDate >= startDate && transactionDate <= endDate) {
        const dayIndex = (transactionDate.getDay() + 6) % 7;
        
        if (t.type === "INCOME") {
          incomeData[dayIndex] += t.amount;
        } else {
          expenseData[dayIndex] += t.amount;
        }
      }
    });

    return { incomeData, expenseData };
  }

  function formatWeeklyProgressData(data, labels) {
    return {
      labels,
      datasets: [
        {
          label: "Общий баланс",
          data: data,
          borderColor: "#2041ff",
          backgroundColor: "rgba(32, 65, 255, 0.1)",
          tension: 0.4,
          fill: true,
        }
      ],
    };
  }

  function formatWeeklyTransactionsData(weeklyData) {
    return {
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
      datasets: [
        {
          label: "Доходы",
          data: weeklyData.incomeData,
          backgroundColor: "#2ecc71",
          borderRadius: 4,
        },
        {
          label: "Расходы",
          data: weeklyData.expenseData,
          backgroundColor: "#e74c3c",
          borderRadius: 4,
        },
      ],
    };
  }

  function formatMonthlyStatsData(categories) {
    const topCategories = categories.slice(0, 5);
    
    const maxAmount = Math.max(...topCategories.map(c => c.amount));
    const minAmount = Math.min(...topCategories.map(c => c.amount));
    const scaleFactor = maxAmount > minAmount * 10 ? Math.log10(maxAmount / minAmount) : 1;
    
    return {
      labels: topCategories.map(c => c.name),
      data: topCategories.map(c => c.amount),
      colors: topCategories.map(c => c.color),
      scaledData: scaleFactor > 1 
        ? topCategories.map(c => Math.log10(c.amount / minAmount + 1) * minAmount)
        : topCategories.map(c => c.amount)
    };
  }


  function getMotivationalMessages(balance, goals) {
    const messages = [];
    
    if (balance > 0) {
        messages.push("Ваш финансовый баланс положительный - это отличный результат!");
    } else {
        messages.push("Каждая копейка приближает вас к финансовой стабильности!");
    }
    
    if (goals && goals.length > 0) {
        const validGoals = goals.filter(g => g && g.target > 0);
        
        if (validGoals.length > 0) {
            const completedGoals = validGoals.filter(g => g.current >= g.target).length;
            
            if (completedGoals > 0) {
                messages.push(`Вы уже достигли ${completedGoals} ${getGoalWordForm(completedGoals)}! Продолжайте в том же духе!`);
            } else {
                const closestGoal = validGoals.reduce((prev, curr) => 
                    (curr.current / curr.target) > (prev.current / prev.target) ? curr : prev
                );
                
                if (closestGoal && closestGoal.title && closestGoal.target > 0) {
                    const progress = Math.round((closestGoal.current / closestGoal.target) * 100);
                    messages.push(`Вы уже на ${progress}% к цели "${closestGoal.title}"!`);
                }
            }
        }
    }
    
    messages.push(
        "Маленькие шаги приводят к большим результатам.",
        "Финансовая дисциплина - ключ к успеху!",
        "Сегодняшние решения определяют завтрашние возможности."
    );
    
    return messages;
}
function getGoalWordForm(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'целей';
    }
    
    switch (lastDigit) {
        case 1: return 'цели';
        case 2:
        case 3:
        case 4: return 'цели';
        default: return 'целей';
    }
}

  // Получение демо-данных при ошибке
  function getFallbackData() {
    console.warn("Используются демо-данные из-за ошибки загрузки");
    return {
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
      "OTHER": "Другое",
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
      "OTHER": "#7f8c8d",
      "SALARY": "#27ae60",
      "INVESTMENTS": "#16a085",
      "GIFT": "#8e44ad",
      "OTHER_INCOME": "#2c3e50"
    };
    return colors[category] || "#e7adcd";
  }

  function getPaymentMethodDisplayName(paymentMethod) {
    const paymentMethods = {
      'CASH': 'Наличные',
      'DEBIT_CARD': 'Дебетовая карта',
      'CREDIT_CARD': 'Кредитная карта',
      'SAVINGS_ACCOUNT': 'Сберегательный счет',
      'ELECTRONIC_WALLET': 'Электронный кошелек',
      'INVESTMENT_ACCOUNT': 'Инвестиционный счет',
      'BROKERAGE_ACCOUNT': 'Брокерский счет',
      'LOAN_ACCOUNT': 'Кредитный счет',
      'MORTGAGE_ACCOUNT': 'Ипотечный счет',
      'CRYPTOCURRENCY_WALLET': 'Криптовалютный кошелек',
      'OTHER': 'Другое'
    };
    return paymentMethods[paymentMethod] || paymentMethod;
  }

  async function initDashboard() {
    try {
      const data = await loadDashboardData();
      
      initBalance(data.balanceData);
      initWeeklyProgressChart(data.weeklyProgress);
      initTransactionsChart(data.transactions);
      initMonthlyChart(data.monthlyStats);
      initGoals(data.goals);
      initMotivation(data.motivators);
      initCurrencyToggle();
      
      await initRecentTransactions();
      await initUpcomingPayments();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
    }
  }

  function initBalance(data) {
    const totalElement = document.getElementById("total-balance");
    const detailsContainer = document.querySelector(".balance-details");

    totalElement.textContent = formatCurrency(data.total, currentCurrency.code);
    totalElement.dataset.original = data.total;

    detailsContainer.innerHTML = data.accounts
      .map(account => `
        <div class="balance-item">
          <span>${account.name}:</span>
          <span class="amount" data-original="${account.amount}">
            ${formatCurrency(account.amount, currentCurrency.code)}
          </span>
        </div>
      `).join("");
  }

  function initWeeklyProgressChart(data) {
    const ctx = document.getElementById("weeklyProgressChart").getContext("2d");
    if (window.weeklyChart && window.weeklyChart instanceof Chart) {
      window.weeklyChart.destroy();
    }
    
    window.weeklyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Общий баланс",
          data: data.datasets[0].data,
          borderColor: "#2041ff",
          backgroundColor: "rgba(32, 65, 255, 0.1)",
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const convertedValue = value * currentCurrency.rate;
                return `${context.dataset.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol}`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value) {
                const convertedValue = value * currentCurrency.rate;
                return convertedValue.toLocaleString('ru-RU') + ' ' + currentCurrency.symbol;
              }
            }
          }
        }
      }
    });
  }

  function initTransactionsChart(data) {
    const ctx = document.getElementById("transactionsChart").getContext("2d");
    
    if (window.transactionsChart && window.transactionsChart instanceof Chart) {
      window.transactionsChart.destroy();
    }
    
    window.transactionsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Доходы",
            data: data.datasets[0].data,
            backgroundColor: "#2ecc71",
            borderRadius: 4,
          },
          {
            label: "Расходы",
            data: data.datasets[1].data,
            backgroundColor: "#e74c3c",
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const convertedValue = value * currentCurrency.rate;
                return `${context.dataset.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol}`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            ticks: {
              callback: function(value) {
                const convertedValue = value * currentCurrency.rate;
                return convertedValue.toLocaleString('ru-RU') + ' ' + currentCurrency.symbol;
              }
            }
          }
        }
      }
    });
  }


  function initMonthlyChart(data) {
    const ctx = document.getElementById("monthlyChart").getContext("2d");
    if (window.monthlyChart && window.monthlyChart instanceof Chart) {
      window.monthlyChart.destroy();
    }
    
    window.monthlyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors || [
            "#2041ff", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: "right",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const convertedValue = value * currentCurrency.rate;
                const total = context.dataset.data.reduce((a, b) => a + b, 0) * currentCurrency.rate;
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol} (${percentage}%)`;
              }
            }
          }
        },
        cutout: "70%"
      }
    });
  }

  function initGoals(goals) {
    const container = document.querySelector(".goals-list");
    container.innerHTML = goals
      .map(goal => {
        const progress = (goal.current / goal.target) * 100;
        return `
        <div class="goal-item">
          <div class="goal-info">
            <h3>${goal.title}</h3>
            <span class="goal-progress">
              ${formatCurrency(goal.current, currentCurrency.code)} / ${formatCurrency(goal.target, currentCurrency.code)}
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${progress}%"></div>
          </div>
        </div>
      `;
      }).join("");
  }

  function initMotivation(motivators) {
    const motivatorElement = document.getElementById("motivation-text");
    
    if (!motivators || motivators.length === 0) {
        motivatorElement.textContent = "Финансовая дисциплина - ключ к успеху!";
        return;
    }
    
    const motivator = motivators[Math.floor(Math.random() * motivators.length)];
    motivatorElement.textContent = motivator;
}
  function initCurrencyToggle() {
    const toggleBtn = document.getElementById("currency-toggle");
    const currencySymbol = document.getElementById("currency-symbol");
    const totalElement = document.getElementById("total-balance");
    const amountElements = document.querySelectorAll(".amount");
    const transactionAmounts = document.querySelectorAll(".transaction-amount, .payment-amount");

    toggleBtn.addEventListener("click", function() {
      currentCurrency = currencies[(currencies.indexOf(currentCurrency) + 1) % currencies.length];
      
      toggleBtn.textContent = currentCurrency.symbol;
      currencySymbol.textContent = currentCurrency.symbol;

      const originalTotal = parseFloat(totalElement.dataset.original);
      totalElement.textContent = formatCurrency(originalTotal, currentCurrency.code);

      amountElements.forEach(el => {
        const original = parseFloat(el.dataset.original);
        el.textContent = formatCurrency(original, currentCurrency.code);
      });

      transactionAmounts.forEach(el => {
        const original = parseFloat(el.closest('[data-original-amount]')?.dataset.originalAmount || "0");
        const isExpense = el.classList.contains('expense') || el.classList.contains('payment-amount');
        el.textContent = `${isExpense ? '-' : '+'}${formatCurrency(original, currentCurrency.code)}`;
      });

      updateChartsWithCurrency();
    });
  }

  function updateChartsWithCurrency() {
    if (window.weeklyChart) {
      window.weeklyChart.options.plugins.tooltip.callbacks.label = function(context) {
        const value = context.raw;
        const convertedValue = value * currentCurrency.rate;
        return `${context.dataset.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol}`;
      };
      window.weeklyChart.options.scales.y.ticks.callback = function(value) {
        const convertedValue = value * currentCurrency.rate;
        return convertedValue.toLocaleString('ru-RU') + ' ' + currentCurrency.symbol;
      };
      window.weeklyChart.update();
    }

    if (window.transactionsChart) {
      window.transactionsChart.options.plugins.tooltip.callbacks.label = function(context) {
        const value = context.raw;
        const convertedValue = value * currentCurrency.rate;
        return `${context.dataset.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol}`;
      };
      window.transactionsChart.options.scales.y.ticks.callback = function(value) {
        const convertedValue = value * currentCurrency.rate;
        return convertedValue.toLocaleString('ru-RU') + ' ' + currentCurrency.symbol;
      };
      window.transactionsChart.update();
    }

    if (window.monthlyChart) {
      window.monthlyChart.options.plugins.tooltip.callbacks.label = function(context) {
        const value = context.raw;
        const convertedValue = value * currentCurrency.rate;
        const total = context.dataset.data.reduce((a, b) => a + b, 0) * currentCurrency.rate;
        const percentage = Math.round((value / total) * 100);
        return `${context.label}: ${convertedValue.toLocaleString('ru-RU')} ${currentCurrency.symbol} (${percentage}%)`;
      };
      window.monthlyChart.update();
    }
  }

  initDashboard();
});