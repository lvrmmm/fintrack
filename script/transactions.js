document.addEventListener("DOMContentLoaded", function () {
  // Инициализация данных
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
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

  // Категории и счета
  const categories = [
    "Продукты",
    "Транспорт",
    "Жильё",
    "Развлечения",
    "Зарплата",
    "Подарки",
    "Здоровье",
    "Образование",
    "Другое",
  ];

  const accounts = ["Карта", "Наличные", "Криптовалюта", "Другое"];

  // Инициализация дат фильтра
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  dateStart.valueAsDate = firstDayOfMonth;
  dateEnd.valueAsDate = lastDayOfMonth;

  // Инициализация приложения
  init();

  function init() {
    // Загрузка демо-данных, если нет сохраненных
    if (transactions.length === 0) {
      loadDemoData();
    }

    setupEventListeners();
    renderTransactions();
    renderWeeklyChart();
  }

  function setupEventListeners() {
    // Переключение валюты
    currencyToggle.addEventListener("click", toggleCurrency);

    // Кнопки добавления/закрытия
    addTransactionBtn.addEventListener("click", () =>
      openModal("Добавить транзакцию")
    );

    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    // Форма транзакции
    transactionForm.addEventListener("submit", handleFormSubmit);

    // Фильтры
    applyFiltersBtn.addEventListener("click", renderTransactions);
    resetFiltersBtn.addEventListener("click", resetFilters);

    // Делегирование событий для кнопок в таблице
    tbody.addEventListener("click", handleTableClick);
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

  function handleFormSubmit(e) {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(transactionForm));
    saveTransaction(formData);
  }

  function toggleCurrency() {
    currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
    currencyToggle.textContent = currencies[currentCurrencyIndex].symbol;
    renderTransactions();
    renderWeeklyChart();
  }

  function resetFilters() {
    typeFilter.value = "all";
    categoryFilter.value = "all";
    accountFilter.value = "all";
    amountMin.value = "";
    amountMax.value = "";
    dateStart.valueAsDate = firstDayOfMonth;
    dateEnd.valueAsDate = lastDayOfMonth;
    renderTransactions();
  }

  // Рендер транзакций
  function renderTransactions() {
    const filteredTransactions = filterTransactions();
    tbody.innerHTML = "";

    const currency = currencies[currentCurrencyIndex];
    const averageExpense = calculateAverageExpense(filteredTransactions);

    if (filteredTransactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="no-transactions">Нет транзакций, соответствующих выбранным фильтрам</td>
        </tr>
      `;
      return;
    }

    filteredTransactions.forEach((t) => {
      const tr = document.createElement("tr");
      const convertedAmount = t.amount * currency.rate;
      const highlightClass =
        t.type === "expense" && t.amount > averageExpense ? "highlight" : "";

      tr.innerHTML = `
        <td>${formatDate(t.date)}</td>
        <td>${t.category}</td>
        <td>${t.account}</td>
        <td class="${t.type} ${highlightClass}">${formatCurrency(
        convertedAmount,
        currency
      )}</td>
        <td><span class="transaction-type ${t.type}">${
        t.type === "income" ? "Доход" : "Расход"
      }</span></td>
        <td class="actions">
          <button class="edit" data-id="${
            t.id
          }"><i class="bx bx-edit"></i></button>
          <button class="delete" data-id="${
            t.id
          }"><i class="bx bx-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Фильтрация транзакций
  function filterTransactions() {
    return transactions.filter((t) => {
      // Фильтр по типу
      if (typeFilter.value !== "all" && t.type !== typeFilter.value)
        return false;

      // Фильтр по категории
      if (categoryFilter.value !== "all" && t.category !== categoryFilter.value)
        return false;

      // Фильтр по счету
      if (accountFilter.value !== "all" && t.account !== accountFilter.value)
        return false;

      // Фильтр по сумме
      const amount = t.amount;
      if (amountMin.value && amount < parseFloat(amountMin.value)) return false;
      if (amountMax.value && amount > parseFloat(amountMax.value)) return false;

      // Фильтр по дате
      const transactionDate = new Date(t.date);
      const startDate = dateStart.valueAsDate;
      const endDate = dateEnd.valueAsDate;

      if (startDate && transactionDate < startDate) return false;
      if (endDate && transactionDate > endDate) return false;

      return true;
    });
  }

  // Расчет среднего расхода
  function calculateAverageExpense(transactionsList) {
    const expenses = transactionsList
      .filter((t) => t.type === "expense")
      .map((t) => t.amount);

    return expenses.length > 0
      ? expenses.reduce((sum, amount) => sum + amount, 0) / expenses.length
      : 0;
  }

  // Форматирование даты
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  }

  // Форматирование валюты
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

  // Рендер графика
  function renderWeeklyChart() {
    const currency = currencies[currentCurrencyIndex];
    const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const daysData = Array(7).fill(0);

    // Группировка по дням недели
    transactions.forEach((t) => {
      const day = new Date(t.date).getDay(); // 0-6 (Вс-Сб)
      const index = day === 0 ? 6 : day - 1; // Преобразуем к Пн-Вс (0-6)
      const convertedAmount = t.amount * currency.rate;
      daysData[index] +=
        t.type === "income" ? convertedAmount : -convertedAmount;
    });

    const ctx = document.getElementById("weeklyProgressChart").getContext("2d");

    // Удаляем предыдущий график, если он существует
    if (window.weeklyChart) {
      window.weeklyChart.destroy();
    }

    window.weeklyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Баланс",
            data: daysData,
            backgroundColor: daysData.map((val) =>
              val >= 0 ? "#2ecc71" : "#e74c3c"
            ),
            borderColor: daysData.map((val) =>
              val >= 0 ? "#2ecc71" : "#e74c3c"
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) label += ": ";
                label += formatCurrency(context.raw, currency);
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function (value) {
                return formatCurrency(value, currency);
              },
            },
          },
        },
      },
    });
  }

  // Загрузка демо-данных
  function loadDemoData() {
    const demoTransactions = [
      {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        category: "Зарплата",
        account: "Карта",
        amount: 85000,
        type: "income",
        description: "Зарплата за апрель",
      },
      {
        id: Date.now() + 1,
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        category: "Продукты",
        account: "Карта",
        amount: 3450,
        type: "expense",
        description: "Продукты на неделю",
      },
      {
        id: Date.now() + 2,
        date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
        category: "Транспорт",
        account: "Наличные",
        amount: 1200,
        type: "expense",
        description: "Такси до работы",
      },
      {
        id: Date.now() + 3,
        date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
        category: "Развлечения",
        account: "Карта",
        amount: 2500,
        type: "expense",
        description: "Кино",
      },
      {
        id: Date.now() + 4,
        date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
        category: "Подарки",
        account: "Карта",
        amount: 5000,
        type: "expense",
        description: "Подарок на день рождения",
      },
    ];

    demoTransactions.forEach((t) => transactions.push(t));
    saveTransactions();
  }

  // Сохранение транзакций в localStorage
  function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  // Работа с модальным окном
  function openModal(title, transaction = null) {
    document.getElementById("modal-title").textContent = title;
    currentEditingId = transaction ? transaction.id : null;

    if (transaction) {
      // Заполняем форму данными транзакции
      document.getElementById("transaction-date").value = transaction.date;
      document.getElementById("transaction-category").value =
        transaction.category;
      document.getElementById("transaction-account").value =
        transaction.account;
      document.getElementById("transaction-amount").value = transaction.amount;
      document.getElementById("transaction-type").value = transaction.type;
      document.getElementById("transaction-description").value =
        transaction.description || "";
    } else {
      // Сбрасываем форму для новой транзакции
      transactionForm.reset();
      document.getElementById("transaction-date").valueAsDate = new Date();
    }

    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
    currentEditingId = null;
  }

  function saveTransaction(formData) {
    // Валидация
    if (!formData.date || !formData.category || !formData.amount) {
      alert("Пожалуйста, заполните все обязательные поля");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) {
      alert("Сумма должна быть числом");
      return;
    }

    const transaction = {
      id: currentEditingId || Date.now(),
      date: formData.date,
      category: formData.category,
      account: formData.account,
      amount: Math.abs(amount),
      type: formData.type,
      description: formData.description || "",
    };

    if (currentEditingId) {
      // Редактирование
      const index = transactions.findIndex((t) => t.id == currentEditingId);
      if (index !== -1) {
        transactions[index] = transaction;
      }
    } else {
      // Добавление
      transactions.push(transaction);
    }

    saveTransactions();
    renderTransactions();
    renderWeeklyChart();
    closeModal();
  }

  function editTransaction(id) {
    const transaction = transactions.find((t) => t.id == id);
    if (transaction) {
      openModal("Редактировать транзакцию", transaction);
    } else {
      console.error("Транзакция не найдена:", id);
    }
  }

  function deleteTransaction(id) {
    if (confirm("Вы уверены, что хотите удалить эту транзакцию?")) {
      const index = transactions.findIndex((t) => t.id == id);
      if (index !== -1) {
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
        renderWeeklyChart();
      }
    }
  }
});
