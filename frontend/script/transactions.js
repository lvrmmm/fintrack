document.addEventListener("DOMContentLoaded", function () {
  // Инициализация данных
  const transactions = [];
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

  let currentCurrencyIndex = 0;
  let currentEditingId = null;

  // Валюта
  const currencies = [
    { code: "RUB", symbol: "₽", rate: 1 },
    { code: "USD", symbol: "$", rate: 0.011 },
    { code: "EUR", symbol: "€", rate: 0.01 },
  ];

  // Инициализация дат фильтра
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  dateStart.valueAsDate = firstDayOfMonth;
  dateEnd.valueAsDate = lastDayOfMonth;

  // Инициализация приложения
  init();

  async function init() {
    await loadTransactions();
    setupEventListeners();
    renderTransactions();
    renderWeeklyChart();
  }

  function setupEventListeners() {
    currencyToggle.addEventListener("click", toggleCurrency);
    addTransactionBtn.addEventListener("click", () =>
      openModal("Добавить транзакцию")
    );

    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    transactionForm.addEventListener("submit", handleFormSubmit);
    applyFiltersBtn.addEventListener("click", applyFilters);
    resetFiltersBtn.addEventListener("click", resetFilters);
    tbody.addEventListener("click", handleTableClick);
  }

  // Вспомогательные функции
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

  function getPaymentMethodDisplayName(method) {
    const methodNames = {
      CASH: "Наличные",
      CARD: "Карта",
      BANK: "Банк",
      OTHER: "Другое",
    };
    return methodNames[method] || method;
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

    const transactionData = {
      date: form.date.value,
      category: form.category.value,
      paymentMethod: form.paymentMethod.value,
      amount: parseFloat(form.amount.value),
      type: form.type.value,
      description: form.description.value,
    };

    try {
      const url = currentEditingId
        ? `http://localhost:8080/api/transactions/${currentEditingId}`
        : "http://localhost:8080/api/transactions";

      const method = currentEditingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) throw new Error("Ошибка сохранения");

      closeModal();
      await loadTransactions();
      renderTransactions();
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при сохранении транзакции");
    }
  }

  function toggleCurrency() {
    currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
    currencyToggle.textContent = currencies[currentCurrencyIndex].symbol;
    updateTransactionAmounts();
    renderWeeklyChart();
  }

  function updateTransactionAmounts() {
    const rows = tbody.querySelectorAll("tr");
    const currentCurrency = currencies[currentCurrencyIndex];

    rows.forEach((row) => {
      if (row.classList.contains("no-transactions")) return;

      const amountCell = row.querySelector("td:nth-child(4)");
      const originalAmount = parseFloat(amountCell.dataset.originalAmount);
      const displayAmount = originalAmount * currentCurrency.rate;

      amountCell.textContent = formatCurrency(displayAmount, currentCurrency);
    });
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

    // Фильтры всегда отправляются в базовой валюте (рубли)
    if (typeFilter.value !== "all") params.append("type", typeFilter.value);
    if (categoryFilter.value !== "all")
      params.append("category", categoryFilter.value);
    if (accountFilter.value !== "all")
      params.append("paymentMethod", accountFilter.value);

    // Суммы всегда в рублях, конвертируем если нужно
    if (amountMin.value) {
      const baseAmountMin =
        parseFloat(amountMin.value) / currencies[currentCurrencyIndex].rate;
      params.append("amountMin", baseAmountMin.toString());
    }
    if (amountMax.value) {
      const baseAmountMax =
        parseFloat(amountMax.value) / currencies[currentCurrencyIndex].rate;
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
    // 1. Получаем отфильтрованные транзакции (все суммы в рублях)
    const filteredTransactions = await filterTransactions();

    // 2. Проверка на ошибки
    if (!Array.isArray(filteredTransactions)) {
      showErrorMessage("Ошибка загрузки данных");
      return;
    }

    // 3. Проверка на пустой результат
    if (filteredTransactions.length === 0) {
      showNoResultsMessage();
      return;
    }

    // 4. Подготовка данных для отображения
    prepareTransactionsTable(filteredTransactions);
  }

  // Вспомогательные функции:

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
    tbody.innerHTML = ""; // Очищаем таблицу

    const averageExpense = calculateAverageExpense(transactions);
    const currentCurrency = currencies[currentCurrencyIndex];

    transactions.forEach((transaction) => {
      const row = createTransactionRow(
        transaction,
        averageExpense,
        currentCurrency
      );
      tbody.appendChild(row);
    });
  }

  function createTransactionRow(transaction, averageExpense, currency) {
    const tr = document.createElement("tr");

    // Оригинальная сумма в рублях (из сервера)
    const originalAmount = transaction.amount;

    // Сумма в выбранной валюте для отображения
    const displayAmount = originalAmount * currency.rate;

    // Подсветка, если расход выше среднего
    const highlightClass =
      transaction.type === "EXPENSE" && originalAmount > averageExpense
        ? "highlight"
        : "";

    tr.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>${getCategoryDisplayName(transaction.category)}</td>
        <td>${getPaymentMethodDisplayName(transaction.paymentMethod)}</td>
        <td class="${transaction.type.toLowerCase()} ${highlightClass}" 
            data-original-amount="${originalAmount}">
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

  function renderWeeklyChart() {
    const currency = currencies[currentCurrencyIndex];

    // Получаем текущую дату и начало недели (понедельник)
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (вс-сб)
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    // Создаем массив дат текущей недели
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }

    // Подготавливаем данные для графика
    const labels = weekDays.map(
      (day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day.getDay()]
    );

    const incomeData = Array(7).fill(0);
    const expenseData = Array(7).fill(0);

    // Фильтруем транзакции текущей недели
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    transactions.forEach((t) => {
      const transactionDate = new Date(t.date);
      if (transactionDate >= monday && transactionDate <= sunday) {
        const dayIndex = (transactionDate.getDay() + 6) % 7; // Пн=0, Вс=6
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
                return `${context.dataset.label}: ${formatCurrency(
                  context.raw,
                  currency
                )}`;
              },
            },
          },
          title: {
            display: true,
            text: `Неделя ${formatDate(monday.toISOString())} - ${formatDate(
              sunday.toISOString()
            )}`,
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
    form.date.value = transaction.date;
    form.category.value = transaction.category;
    form.paymentMethod.value = transaction.paymentMethod;
    form.amount.value = transaction.amount;
    form.type.value = transaction.type;
    form.description.value = transaction.description || "";
  }

  async function deleteTransaction(id) {
    if (!confirm("Удалить транзакцию?")) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/transactions/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error("Ошибка удаления");

      await loadTransactions();
      renderTransactions();
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Ошибка при удалении транзакции");
    }
  }

  const saveTransaction = async (form) => {
    const date = form.date.value; // Дата в формате "YYYY-MM-DD"
    const formattedDate = date;

    const data = {
      date: formattedDate,
      category: form.category.value,
      paymentMethod: form.paymentMethod.value,
      amount: parseFloat(form.amount.value),
      type: form.type.value,
      description: form.description.value,
    };

    const token = localStorage.getItem("token");
    console.log("Токен:", token); // Для отладки

    try {
      const response = await fetch("http://localhost:8080/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Получаем подробности об ошибке с сервера
        console.error("Ошибка при сохранении транзакции:", errorData);
        throw new Error("Ошибка при сохранении транзакции");
      }

      form.reset();
      const modal = document.getElementById("transaction-modal");
      modal.classList.remove("active");
      renderWeeklyChart();
    } catch (error) {
      console.error(error);
    }
  };

  function formatDate(dateString) {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  // function formatCurrency(value, currency) {
  //   if (value >= 1000000) {
  //     return (
  //       (value / 1000000).toLocaleString("ru-RU", {
  //         maximumFractionDigits: 1,
  //       }) +
  //       "M " +
  //       currency.symbol
  //     );
  //   }
  //   if (value >= 1000) {
  //     return (
  //       (value / 1000).toLocaleString("ru-RU", {
  //         maximumFractionDigits: 1,
  //       }) +
  //       "K " +
  //       currency.symbol
  //     );
  //   }
  //   return (
  //     value.toLocaleString("ru-RU", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     }) +
  //     " " +
  //     currency.symbol
  //   );
  // }

  function getToken() {
    return localStorage.getItem("token");
  }

  function formatCurrency(value, currency) {
    return (
      value.toLocaleString("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) +
      " " +
      currency.symbol
    );
  }
});
