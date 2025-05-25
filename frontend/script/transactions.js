document.addEventListener("DOMContentLoaded", function () {
  const transactions = [];
  const accounts = [];
  const tbody = document.getElementById("transactions-body");
  const currencyToggle = document.getElementById("currency-toggle");
  const modal = document.getElementById("transaction-modal");
  const transactionForm = document.getElementById("transaction-form");
  const addTransactionBtn = document.getElementById("add-transaction");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const typeFilter = document.getElementById("type-filter");
  const categoryFilter = document.getElementById("category-filter");
  const accountFilter = document.getElementById("account-filter");
  const amountMin = document.getElementById("amount-min");
  const amountMax = document.getElementById("amount-max");
  const dateStart = document.getElementById("date-start");
  const dateEnd = document.getElementById("date-end");
  const totalBalanceElement = document.getElementById("total-balance");
  const balanceChartCanvas = document.getElementById("balance-chart");
  const transactionAccountSelect = document.getElementById("transaction-account");

  let currentCurrencyIndex = 0;
  let currentEditingId = null;
  let balanceChart = null;

  const currencies = [
    { code: "RUB", symbol: "₽", rate: 1 },
    { code: "USD", symbol: "$", rate: 0.011 },
    { code: "EUR", symbol: "€", rate: 0.01 },
  ];

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
  dateStart.valueAsDate = firstDayOfMonth;
  dateEnd.valueAsDate = lastDayOfMonth;

  init();

  async function init() {
    await loadAccounts();
    await loadTransactions();
    setupEventListeners();
    renderTransactions();
    renderWeeklyChart();
    renderBalanceChart();
    updateTotalBalance();
    await updateTotalBalance();
  }

  function setupEventListeners() {
    currencyToggle.addEventListener("click", toggleCurrency);
    addTransactionBtn.addEventListener("click", () => openModal("Добавить транзакцию"));

    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    transactionForm.addEventListener("submit", handleFormSubmit);
    applyFiltersBtn.addEventListener("click", applyFilters);
    resetFiltersBtn.addEventListener("click", resetFilters);
    tbody.addEventListener("click", handleTableClick);
  }

  function toggleCurrency() {
    currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
    const newCurrency = currencies[currentCurrencyIndex];
    currencyToggle.textContent = newCurrency.symbol;
    
    renderTransactions();
    renderWeeklyChart();
    renderBalanceChart();
    updateTotalBalance();
  }

  async function loadAccounts() {
    try {
      const response = await fetch("http://localhost:8080/api/accounts", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error("Ошибка загрузки счетов");

      const data = await response.json();
      accounts.length = 0;
      accounts.push(...data);

      updateTransactionAccountSelect();
      updateAccountFilter();
    } catch (error) {
      console.error("Ошибка загрузки счетов:", error);
    }
  }

  function updateAccountFilter() {
    accountFilter.innerHTML = `
      <option value="all">Все счета</option>
      ${accounts.map(account => `
        <option value="${account.id}">${getPaymentMethodDisplayName(account.paymentMethod)}</option>
      `).join('')}
    `;
  }

  function updateTransactionAccountSelect() {
    const allPaymentMethods = [
      { id: 'CASH', displayName: 'Наличные' },
      { id: 'DEBIT_CARD', displayName: 'Дебетовая карта' },
      { id: 'CREDIT_CARD', displayName: 'Кредитная карта' },
      { id: 'SAVINGS_ACCOUNT', displayName: 'Сберегательный счет' },
      { id: 'ELECTRONIC_WALLET', displayName: 'Электронный кошелек' },
      { id: 'INVESTMENT_ACCOUNT', displayName: 'Инвестиционный счет' },
      { id: 'BROKERAGE_ACCOUNT', displayName: 'Брокерский счет' },
      { id: 'LOAN_ACCOUNT', displayName: 'Кредитный счет' },
      { id: 'MORTGAGE_ACCOUNT', displayName: 'Ипотечный счет' },
      { id: 'CRYPTOCURRENCY_WALLET', displayName: 'Криптовалютный кошелек' },
      { id: 'OTHER', displayName: 'Другое' }
    ];

    let html = '';
    
    allPaymentMethods.forEach(method => {
      const account = accounts.find(a => a.paymentMethod === method.id);
      
      if (account) {
        html += `<option value="${account.id}" data-has-account="true">
                   ${account.displayName || method.displayName}
                 </option>`;
      } else {
        html += `<option value="${method.id}" data-has-account="false">
                   ${method.displayName} (создать)
                 </option>`;
      }
    });

    transactionAccountSelect.innerHTML = html;
  }

  async function updateTotalBalance() {
    try {
      console.log('Загрузка общего баланса...');
      
      const response = await fetch("http://localhost:8080/api/accounts/total-balance", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Получены данные:', data);

      if (data.totalBalance === undefined || data.totalBalance === null) {
        throw new Error('Баланс не получен в ответе');
      }

      const balanceValue = parseFloat(data.totalBalance);
      if (isNaN(balanceValue)) {
        throw new Error('Некорректное значение баланса');
      }

      const currency = currencies[currentCurrencyIndex];
      const convertedBalance = balanceValue * currency.rate;

      console.log('Конвертированный баланс:', convertedBalance);
      
      const formattedBalance = formatCurrency(convertedBalance, currency);
      console.log('Форматированный баланс:', formattedBalance);

      if (!totalBalanceElement) {
        throw new Error('Элемент для отображения баланса не найден');
      }

      totalBalanceElement.textContent = formattedBalance;
      console.log('Баланс успешно обновлен');
      
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      
      if (totalBalanceElement) {
        totalBalanceElement.textContent = formatCurrency(0, currencies[0]);
        totalBalanceElement.style.color = 'red';
        totalBalanceElement.title = error.message;
      }
    }
  }

  async function renderBalanceChart() {
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Получаем все транзакции за текущий месяц
      const response = await fetch(
        `http://localhost:8080/api/transactions?startDate=${formatDateForAPI(firstDay)}&endDate=${formatDateForAPI(lastDay)}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка загрузки данных транзакций");
      }

      const transactions = await response.json();
      
      const daysInMonth = lastDay.getDate();
      const allDates = Array.from({length: daysInMonth}, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        return formatDateForAPI(date);
      });

      // Получаем начальный баланс (на конец предыдущего месяца)
      const balanceResponse = await fetch(
        `http://localhost:8080/api/accounts/total-balance-history?endDate=${formatDateForAPI(new Date(firstDay.getTime() - 1))}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      
      let initialBalance = 0;
      if (balanceResponse.ok) {
        const balanceHistory = await balanceResponse.json();
        if (balanceHistory.length > 0) {
          initialBalance = balanceHistory[0].totalBalance;
        }
      }

      // Группируем транзакции по датам
      const transactionsByDate = {};
      transactions.forEach(transaction => {
        const date = transaction.date; 
        if (!transactionsByDate[date]) {
          transactionsByDate[date] = [];
        }
        transactionsByDate[date].push(transaction);
      });

      let currentBalance = initialBalance;
      const dailyBalances = allDates.map(date => {
        if (transactionsByDate[date]) {
          const dayChange = transactionsByDate[date].reduce((sum, t) => {
            return sum + (t.type === "INCOME" ? t.amount : -t.amount);
          }, 0);
          currentBalance += dayChange;
        }
        return {
          date: date,
          balance: currentBalance
        };
      });

      if (dailyBalances.length === 0) {
        balanceChartCanvas.innerHTML = `
          <div class="no-data-chart">
            <i class='bx bx-line-chart'></i>
            <p>Нет данных для отображения</p>
          </div>`;
        return;
      }

      const labels = dailyBalances.map(item => formatDate(item.date));
      const balances = dailyBalances.map(item => item.balance * currencies[currentCurrencyIndex].rate);

      if (balanceChart) {
        balanceChart.data.labels = labels;
        balanceChart.data.datasets[0].data = balances;
        balanceChart.update();
      } else {
        const ctx = balanceChartCanvas.getContext('2d');
        balanceChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Общий баланс',
              data: balances,
              borderColor: '#4c72af',
              backgroundColor: 'rgba(117,152,209,0.1)',
              fill: true,
              tension: 0.1,
              pointBackgroundColor: '#4c72af',
              pointRadius: 3,
              pointHoverRadius: 5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                font: {
                  size: 1
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${formatCurrency(context.raw, currencies[currentCurrencyIndex])}`;
                  },
                  title: function(context) {
                    return context[0].label;
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                beginAtZero: false,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  callback: function(value) {
                    return formatCurrency(value, currencies[currentCurrencyIndex]);
                  }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        });
      }
      
      await updateTotalBalance();
      
    } catch (error) {
      console.error("Ошибка:", error);
      balanceChartCanvas.innerHTML = `
        <div class="error-chart">
          <i class='bx bx-error-circle'></i>
          <p>Ошибка загрузки данных</p>
          <small>${error.message}</small>
        </div>`;
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getCategoryDisplayName(category) {
    const categoryNames = {
      SALARY: "Зарплата",
      GROCERIES: "Продукты",
      TRANSPORT: "Транспорт",
      UTILITIES: "Жильё",
      ENTERTAINMENT: "Развлечения",
      HEALTH: "Здоровье",
      EDUCATION: "Образование",
      CLOTHING: "Одежда",
      TRAVEL: "Путешествия",
      INVESTMENTS: "Инвестиции",
      OTHER: "Другое",
    };
    return categoryNames[category] || category;
  }

  function calculateAverageExpense(transactionsList) {
    if (!Array.isArray(transactionsList)) return 0;

    const expenses = transactionsList
      .filter((t) => t.type === "EXPENSE")
      .map((t) => parseFloat(t.amount));

    return expenses.length > 0
      ? expenses.reduce((sum, amount) => sum + amount, 0) / expenses.length
      : 0;
  }

  function closeModal() {
    modal.classList.remove("active");
    transactionForm.reset();
    currentEditingId = null;
  }

  function openModal(title) {
    document.getElementById("modal-title").textContent = title;
    modal.classList.add("active");
  }

  function handleTableClick(e) {
    const target = e.target;
    const editBtn = target.closest(".edit");
    const deleteBtn = target.closest(".delete");

    if (editBtn) {
      const id = editBtn.dataset.id;
      editTransaction(id);
    } else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      deleteTransaction(id);
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    const accountSelect = document.getElementById("transaction-account");
    const selectedOption = accountSelect.options[accountSelect.selectedIndex];
    const isNewAccount = selectedOption.dataset.hasAccount === "false";
    
    const transactionData = {
      date: form.date.value,
      category: form.category.value,
      amount: parseFloat(form.amount.value),
      type: form.type.value,
      description: form.description.value || null
    };

    if (isNewAccount) {
      transactionData.paymentMethod = form.accountId.value; 
    } else {
      transactionData.accountId = form.accountId.value; 
    }

    try {
      let response;
      
      if (currentEditingId) {
      
        response = await fetch(`http://localhost:8080/api/transactions/${currentEditingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(transactionData),
        });
      } else {
        response = await fetch("http://localhost:8080/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(transactionData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Ошибка сохранения");
      }

      
      await Promise.all([
        loadAccounts(),
        loadTransactions()
      ]);
      
      renderTransactions();
      renderWeeklyChart();
      renderBalanceChart();
      await updateTotalBalance();
      
      closeModal();
    } catch (error) {
      console.error("Ошибка:", error);
      alert(`Ошибка при сохранении транзакции: ${error.message}`);
    }
  } 

  function resetFilters() {
    typeFilter.value = "all";
    categoryFilter.value = "all";
    accountFilter.value = "all";
    amountMin.value = "";
    amountMax.value = "";
    dateStart.valueAsDate = firstDayOfMonth;
    dateEnd.valueAsDate = lastDayOfMonth;
    applyFilters();
  }

  async function applyFilters() {
    await loadTransactions();
    renderTransactions();
  }

  async function filterTransactions() {
    const params = new URLSearchParams();

    if (typeFilter.value !== "all") params.append("type", typeFilter.value);
    if (categoryFilter.value !== "all") params.append("category", categoryFilter.value);
    if (accountFilter.value !== "all") params.append("accountId", accountFilter.value);

    if (amountMin.value) {
      const baseAmountMin = parseFloat(amountMin.value) / currencies[currentCurrencyIndex].rate;
      params.append("amountMin", baseAmountMin.toString());
    }
    if (amountMax.value) {
      const baseAmountMax = parseFloat(amountMax.value) / currencies[currentCurrencyIndex].rate;
      params.append("amountMax", baseAmountMax.toString());
    }

    if (dateStart.value) params.append("dateStart", dateStart.value);
    if (dateEnd.value) params.append("dateEnd", dateEnd.value);

    try {
      const response = await fetch(
        `http://localhost:8080/api/transactions/filter?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      if (!response.ok) throw new Error("Ошибка фильтрации");
      return await response.json();
    } catch (error) {
      console.error("Ошибка фильтрации:", error);
      return [];
    }
  }

  async function renderTransactions() {
    const filteredTransactions = await filterTransactions();

    if (!Array.isArray(filteredTransactions)) {
      showErrorMessage("Ошибка загрузки данных");
      return;
    }

    if (filteredTransactions.length === 0) {
      showNoResultsMessage();
      return;
    }

    prepareTransactionsTable(filteredTransactions);
  }

  function showErrorMessage(message) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-transactions">${message}</td></tr>`;
  }

  function showNoResultsMessage() {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="no-transactions">
          <i class='bx bx-search-alt'></i>
          <div>Транзакции не найдены</div>
          <small>Попробуйте изменить параметры фильтрации</small>
        </td>
      </tr>
    `;
  }

  function prepareTransactionsTable(transactions) {
    tbody.innerHTML = "";

    const averageExpense = calculateAverageExpense(transactions);
    const currentCurrency = currencies[currentCurrencyIndex];

    transactions.forEach((transaction) => {
      const row = createTransactionRow(transaction, averageExpense, currentCurrency);
      tbody.appendChild(row);
    });
  }

  function createTransactionRow(transaction, averageExpense, currency) {
    const tr = document.createElement("tr");
    const originalAmount = transaction.amount;
    const displayAmount = originalAmount * currency.rate;
    const highlightClass = transaction.type === "EXPENSE" && originalAmount > averageExpense ? "highlight" : "";

    const account = accounts.find(a => a.id === transaction.accountId);
    const accountName = account ? 
      (account.displayName || getPaymentMethodDisplayName(account.paymentMethod)) : 
      getPaymentMethodDisplayName(transaction.paymentMethod);

    tr.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td>${getCategoryDisplayName(transaction.category)}</td>
      <td>${accountName}</td>
      <td class="${transaction.type.toLowerCase()} ${highlightClass}">
        ${formatCurrency(displayAmount, currency)}
      </td>
      <td>
        <span class="transaction-type ${transaction.type.toLowerCase()}">
          ${transaction.type === "INCOME" ? "Доход" : "Расход"}
        </span>
      </td>
      <td class="actions">
        <button class="edit" data-id="${transaction.id}">
          <i class="bx bx-edit"></i>
        </button>
        <button class="delete" data-id="${transaction.id}">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    `;
    return tr;
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

  function renderWeeklyChart() {
    const currency = currencies[currentCurrencyIndex];
    const now = new Date();
    const currentDay = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }

    const labels = weekDays.map(
      (day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day.getDay()]
    );

    const incomeData = Array(7).fill(0);
    const expenseData = Array(7).fill(0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    transactions.forEach((t) => {
      const transactionDate = new Date(t.date);
      if (transactionDate >= monday && transactionDate <= sunday) {
        const dayIndex = (transactionDate.getDay() + 6) % 7;
        const convertedAmount = t.amount * currency.rate;

        if (t.type === "INCOME") {
          incomeData[dayIndex] += convertedAmount;
        } else {
          expenseData[dayIndex] += convertedAmount;
        }
      }
    });

    const ctx = document.getElementById("weeklyProgressChart").getContext("2d");

    if (window.weeklyChart) {
      window.weeklyChart.destroy();
    }

    window.weeklyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Доходы",
            data: incomeData,
            backgroundColor: "#2ecc71",
          },
          {
            label: "Расходы",
            data: expenseData,
            backgroundColor: "#e74c3c",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return formatCurrency(value, currency);
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${formatCurrency(context.raw, currency)}`;
              },
            },
          },
          title: {
            display: true,
            font: {
              size: 14,
            },
          },
        },
      },
    });
  }

  async function loadTransactions() {
    try {
      const response = await fetch("http://localhost:8080/api/transactions", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error("Ошибка загрузки");

      const data = await response.json();
      transactions.length = 0;
      transactions.push(...data);
    } catch (error) {
      console.error("Ошибка загрузки транзакций:", error);
    }
  }

  function editTransaction(id) {
    const transaction = transactions.find((t) => t.id == id);
    if (!transaction) return;

    currentEditingId = id;
    openModal("Редактировать транзакцию");

    const form = transactionForm;
    form.date.value = transaction.date.split('T')[0];
    form.category.value = transaction.category;
    
    const accountSelect = form.accountId;
    for (let i = 0; i < accountSelect.options.length; i++) {
      const option = accountSelect.options[i];
      if (option.value === transaction.accountId?.toString()) {
        option.selected = true;
        break;
      }
    }   
    
    form.amount.value = transaction.amount;
    form.type.value = transaction.type;
    form.description.value = transaction.description || "";
  }

  async function deleteTransaction(id) {
    if (!confirm("Удалить транзакцию?")) return;

    try {
      const response = await fetch(`http://localhost:8080/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) throw new Error("Ошибка удаления");

      await loadTransactions();
      renderTransactions();
      renderWeeklyChart();
      renderBalanceChart();
      updateTotalBalance();
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Ошибка при удалении транзакции");
    }
  }

  function formatDate(dateString) {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function formatCurrency(value, currency) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " " + currency.symbol;
  }
});