// document.addEventListener("DOMContentLoaded", function () {
//   // Инициализация данных
//   const transactions = [];
//   const tbody = document.getElementById("transactions-body");
//   const currencyToggle = document.getElementById("currency-toggle");
//   const modal = document.getElementById("transaction-modal");
//   const transactionForm = document.getElementById("transaction-form");
//   const addTransactionBtn = document.getElementById("add-transaction");
//   const applyFiltersBtn = document.getElementById("apply-filters");
//   const resetFiltersBtn = document.getElementById("reset-filters");
//   const typeFilter = document.getElementById("type-filter");
//   const categoryFilter = document.getElementById("category-filter");
//   const accountFilter = document.getElementById("account-filter");
//   const amountMin = document.getElementById("amount-min");
//   const amountMax = document.getElementById("amount-max");
//   const dateStart = document.getElementById("date-start");
//   const dateEnd = document.getElementById("date-end");

//   let currentCurrencyIndex = 0;
//   let currentEditingId = null;

//   // Валюта
//   const currencies = [
//     { code: "RUB", symbol: "₽", rate: 1 },
//     { code: "USD", symbol: "$", rate: 0.011 },
//     { code: "EUR", symbol: "€", rate: 0.01 },
//   ];

//   // Инициализация дат фильтра
//   const today = new Date();
//   const year = today.getFullYear();
//   const month = today.getMonth();

//   const firstDayOfMonth = new Date(year, month, 1);
//   const lastDayOfMonth = new Date(year, month + 1, 0);

//   dateStart.valueAsDate = firstDayOfMonth;
//   dateEnd.valueAsDate = lastDayOfMonth;

//   // Инициализация приложения
//   init();

//   async function init() {
//     await loadTransactions();
//     setupEventListeners();
//     renderTransactions();
//     renderWeeklyChart();
//   }

//   function setupEventListeners() {
//     currencyToggle.addEventListener("click", toggleCurrency);
//     addTransactionBtn.addEventListener("click", () =>
//       openModal("Добавить транзакцию")
//     );

//     document.querySelectorAll(".close-modal").forEach((btn) => {
//       btn.addEventListener("click", closeModal);
//     });

//     transactionForm.addEventListener("submit", handleFormSubmit);
//     applyFiltersBtn.addEventListener("click", applyFilters);
//     resetFiltersBtn.addEventListener("click", resetFilters);
//     tbody.addEventListener("click", handleTableClick);
//   }

//   // Вспомогательные функции
//   function getCategoryDisplayName(category) {
//     const categoryNames = {
//       SALARY: "Зарплата",
//       GROCERIES: "Продукты",
//       TRANSPORT: "Транспорт",
//       UTILITIES: "Жильё",
//       ENTERTAINMENT: "Развлечения",
//       HEALTH: "Здоровье",
//       EDUCATION: "Образование",
//       CLOTHING: "Одежда",
//       TRAVEL: "Путешествия",
//       INVESTMENTS: "Инвестиции",
//       OTHER: "Другое",
//     };
//     return categoryNames[category] || category;
//   }

//   function getPaymentMethodDisplayName(method) {
//     const methodNames = {
//       CASH: "Наличные",
//       CARD: "Карта",
//       BANK: "Банк",
//       OTHER: "Другое",
//     };
//     return methodNames[method] || method;
//   }

//   function calculateAverageExpense(transactionsList) {
//     if (!Array.isArray(transactionsList)) return 0;

//     const expenses = transactionsList
//       .filter((t) => t.type === "EXPENSE")
//       .map((t) => parseFloat(t.amount));

//     return expenses.length > 0
//       ? expenses.reduce((sum, amount) => sum + amount, 0) / expenses.length
//       : 0;
//   }

//   function closeModal() {
//     modal.classList.remove("active");
//     transactionForm.reset();
//     currentEditingId = null;
//   }

//   function openModal(title) {
//     document.getElementById("modal-title").textContent = title;
//     modal.classList.add("active");
//   }

//   function handleTableClick(e) {
//     const target = e.target;
//     const editBtn = target.closest(".edit");
//     const deleteBtn = target.closest(".delete");

//     if (editBtn) {
//       const id = editBtn.dataset.id;
//       editTransaction(id);
//     } else if (deleteBtn) {
//       const id = deleteBtn.dataset.id;
//       deleteTransaction(id);
//     }
//   }

//   async function handleFormSubmit(event) {
//     event.preventDefault();
//     const form = event.target;

//     const transactionData = {
//       date: form.date.value,
//       category: form.category.value,
//       paymentMethod: form.paymentMethod.value,
//       amount: parseFloat(form.amount.value),
//       type: form.type.value,
//       description: form.description.value,
//     };

//     try {
//       const url = currentEditingId
//         ? `http://localhost:8080/api/transactions/${currentEditingId}`
//         : "http://localhost:8080/api/transactions";

//       const method = currentEditingId ? "PUT" : "POST";

//       const response = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${getToken()}`,
//         },
//         body: JSON.stringify(transactionData),
//       });

//       if (!response.ok) throw new Error("Ошибка сохранения");

//       closeModal();
//       await loadTransactions();
//       renderTransactions();
//     } catch (error) {
//       console.error("Ошибка:", error);
//       alert("Ошибка при сохранении транзакции");
//     }
//   }

//   function toggleCurrency() {
//     currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
//     currencyToggle.textContent = currencies[currentCurrencyIndex].symbol;
//     updateTransactionAmounts();
//     renderWeeklyChart();
//   }

//   function updateTransactionAmounts() {
//     const rows = tbody.querySelectorAll("tr");
//     const currentCurrency = currencies[currentCurrencyIndex];

//     rows.forEach((row) => {
//       if (row.classList.contains("no-transactions")) return;

//       const amountCell = row.querySelector("td:nth-child(4)");
//       const originalAmount = parseFloat(amountCell.dataset.originalAmount);
//       const displayAmount = originalAmount * currentCurrency.rate;

//       amountCell.textContent = formatCurrency(displayAmount, currentCurrency);
//     });
//   }

//   function resetFilters() {
//     typeFilter.value = "all";
//     categoryFilter.value = "all";
//     accountFilter.value = "all";
//     amountMin.value = "";
//     amountMax.value = "";
//     dateStart.valueAsDate = firstDayOfMonth;
//     dateEnd.valueAsDate = lastDayOfMonth;
//     applyFilters();
//   }

//   async function applyFilters() {
//     await loadTransactions();
//     renderTransactions();
//   }

//   async function filterTransactions() {
//     const params = new URLSearchParams();

//     // Фильтры всегда отправляются в базовой валюте (рубли)
//     if (typeFilter.value !== "all") params.append("type", typeFilter.value);
//     if (categoryFilter.value !== "all")
//       params.append("category", categoryFilter.value);
//     if (accountFilter.value !== "all")
//       params.append("paymentMethod", accountFilter.value);

//     // Суммы всегда в рублях, конвертируем если нужно
//     if (amountMin.value) {
//       const baseAmountMin =
//         parseFloat(amountMin.value) / currencies[currentCurrencyIndex].rate;
//       params.append("amountMin", baseAmountMin.toString());
//     }
//     if (amountMax.value) {
//       const baseAmountMax =
//         parseFloat(amountMax.value) / currencies[currentCurrencyIndex].rate;
//       params.append("amountMax", baseAmountMax.toString());
//     }

//     if (dateStart.value) params.append("dateStart", dateStart.value);
//     if (dateEnd.value) params.append("dateEnd", dateEnd.value);

//     try {
//       const response = await fetch(
//         `http://localhost:8080/api/transactions/filter?${params.toString()}`,
//         {
//           headers: {
//             Authorization: `Bearer ${getToken()}`,
//           },
//         }
//       );
//       if (!response.ok) throw new Error("Ошибка фильтрации");
//       return await response.json();
//     } catch (error) {
//       console.error("Ошибка фильтрации:", error);
//       return [];
//     }
//   }

//   async function renderTransactions() {
//     // 1. Получаем отфильтрованные транзакции (все суммы в рублях)
//     const filteredTransactions = await filterTransactions();

//     // 2. Проверка на ошибки
//     if (!Array.isArray(filteredTransactions)) {
//       showErrorMessage("Ошибка загрузки данных");
//       return;
//     }

//     // 3. Проверка на пустой результат
//     if (filteredTransactions.length === 0) {
//       showNoResultsMessage();
//       return;
//     }

//     // 4. Подготовка данных для отображения
//     prepareTransactionsTable(filteredTransactions);
//   }

//   // Вспомогательные функции:

//   function showErrorMessage(message) {
//     tbody.innerHTML = `<tr><td colspan="6" class="no-transactions">${message}</td></tr>`;
//   }

//   function showNoResultsMessage() {
//     tbody.innerHTML = `
//         <tr>
//             <td colspan="6" class="no-transactions">
//                 <i class='bx bx-search-alt'></i>
//                 <div>Транзакции не найдены</div>
//                 <small>Попробуйте изменить параметры фильтрации</small>
//             </td>
//         </tr>
//     `;
//   }

//   function prepareTransactionsTable(transactions) {
//     tbody.innerHTML = ""; // Очищаем таблицу

//     const averageExpense = calculateAverageExpense(transactions);
//     const currentCurrency = currencies[currentCurrencyIndex];

//     transactions.forEach((transaction) => {
//       const row = createTransactionRow(
//         transaction,
//         averageExpense,
//         currentCurrency
//       );
//       tbody.appendChild(row);
//     });
//   }

//   function createTransactionRow(transaction, averageExpense, currency) {
//     const tr = document.createElement("tr");

//     // Оригинальная сумма в рублях (из сервера)
//     const originalAmount = transaction.amount;

//     // Сумма в выбранной валюте для отображения
//     const displayAmount = originalAmount * currency.rate;

//     // Подсветка, если расход выше среднего
//     const highlightClass =
//       transaction.type === "EXPENSE" && originalAmount > averageExpense
//         ? "highlight"
//         : "";

//     tr.innerHTML = `
//         <td>${formatDate(transaction.date)}</td>
//         <td>${getCategoryDisplayName(transaction.category)}</td>
//         <td>${getPaymentMethodDisplayName(transaction.paymentMethod)}</td>
//         <td class="${transaction.type.toLowerCase()} ${highlightClass}"
//             data-original-amount="${originalAmount}">
//             ${formatCurrency(displayAmount, currency)}
//         </td>
//         <td>
//             <span class="transaction-type ${transaction.type.toLowerCase()}">
//                 ${transaction.type === "INCOME" ? "Доход" : "Расход"}
//             </span>
//         </td>
//         <td class="actions">
//             <button class="edit" data-id="${transaction.id}">
//                 <i class="bx bx-edit"></i>
//             </button>
//             <button class="delete" data-id="${transaction.id}">
//                 <i class="bx bx-trash"></i>
//             </button>
//         </td>
//     `;

//     return tr;
//   }

//   function renderWeeklyChart() {
//     const currency = currencies[currentCurrencyIndex];

//     // Получаем текущую дату и начало недели (понедельник)
//     const now = new Date();
//     const currentDay = now.getDay(); // 0-6 (вс-сб)
//     const monday = new Date(now);
//     monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
//     monday.setHours(0, 0, 0, 0);

//     // Создаем массив дат текущей недели
//     const weekDays = [];
//     for (let i = 0; i < 7; i++) {
//       const day = new Date(monday);
//       day.setDate(monday.getDate() + i);
//       weekDays.push(day);
//     }

//     // Подготавливаем данные для графика
//     const labels = weekDays.map(
//       (day) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][day.getDay()]
//     );

//     const incomeData = Array(7).fill(0);
//     const expenseData = Array(7).fill(0);

//     // Фильтруем транзакции текущей недели
//     const sunday = new Date(monday);
//     sunday.setDate(monday.getDate() + 6);
//     sunday.setHours(23, 59, 59, 999);

//     transactions.forEach((t) => {
//       const transactionDate = new Date(t.date);
//       if (transactionDate >= monday && transactionDate <= sunday) {
//         const dayIndex = (transactionDate.getDay() + 6) % 7; // Пн=0, Вс=6
//         const convertedAmount = t.amount * currency.rate;

//         if (t.type === "INCOME") {
//           incomeData[dayIndex] += convertedAmount;
//         } else {
//           expenseData[dayIndex] += convertedAmount;
//         }
//       }
//     });

//     const ctx = document.getElementById("weeklyProgressChart").getContext("2d");

//     if (window.weeklyChart) {
//       window.weeklyChart.destroy();
//     }

//     window.weeklyChart = new Chart(ctx, {
//       type: "bar",
//       data: {
//         labels: labels,
//         datasets: [
//           {
//             label: "Доходы",
//             data: incomeData,
//             backgroundColor: "#2ecc71",
//           },
//           {
//             label: "Расходы",
//             data: expenseData,
//             backgroundColor: "#e74c3c",
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         scales: {
//           y: {
//             beginAtZero: true,
//             ticks: {
//               callback: function (value) {
//                 return formatCurrency(value, currency);
//               },
//             },
//           },
//         },
//         plugins: {
//           tooltip: {
//             callbacks: {
//               label: function (context) {
//                 return `${context.dataset.label}: ${formatCurrency(
//                   context.raw,
//                   currency
//                 )}`;
//               },
//             },
//           },
//           title: {
//             display: true,
//             text: `Неделя ${formatDate(monday.toISOString())} - ${formatDate(
//               sunday.toISOString()
//             )}`,
//             font: {
//               size: 14,
//             },
//           },
//         },
//       },
//     });
//   }

//   async function loadTransactions() {
//     try {
//       const response = await fetch("http://localhost:8080/api/transactions", {
//         headers: {
//           Authorization: `Bearer ${getToken()}`,
//         },
//       });

//       if (!response.ok) throw new Error("Ошибка загрузки");

//       const data = await response.json();
//       transactions.length = 0;
//       transactions.push(...data);
//     } catch (error) {
//       console.error("Ошибка загрузки транзакций:", error);
//     }
//   }

//   function editTransaction(id) {
//     const transaction = transactions.find((t) => t.id == id);
//     if (!transaction) return;

//     currentEditingId = id;
//     openModal("Редактировать транзакцию");

//     const form = transactionForm;
//     form.date.value = transaction.date;
//     form.category.value = transaction.category;
//     form.paymentMethod.value = transaction.paymentMethod;
//     form.amount.value = transaction.amount;
//     form.type.value = transaction.type;
//     form.description.value = transaction.description || "";
//   }

//   async function deleteTransaction(id) {
//     if (!confirm("Удалить транзакцию?")) return;

//     try {
//       const response = await fetch(
//         `http://localhost:8080/api/transactions/${id}`,
//         {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${getToken()}`,
//           },
//         }
//       );

//       if (!response.ok) throw new Error("Ошибка удаления");

//       await loadTransactions();
//       renderTransactions();
//     } catch (error) {
//       console.error("Ошибка удаления:", error);
//       alert("Ошибка при удалении транзакции");
//     }
//   }

//   const saveTransaction = async (form) => {
//     const date = form.date.value; // Дата в формате "YYYY-MM-DD"
//     const formattedDate = date;

//     const data = {
//       date: formattedDate,
//       category: form.category.value,
//       paymentMethod: form.paymentMethod.value,
//       amount: parseFloat(form.amount.value),
//       type: form.type.value,
//       description: form.description.value,
//     };

//     const token = localStorage.getItem("token");
//     console.log("Токен:", token); // Для отладки

//     try {
//       const response = await fetch("http://localhost:8080/api/transactions", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         const errorData = await response.json(); // Получаем подробности об ошибке с сервера
//         console.error("Ошибка при сохранении транзакции:", errorData);
//         throw new Error("Ошибка при сохранении транзакции");
//       }

//       form.reset();
//       const modal = document.getElementById("transaction-modal");
//       modal.classList.remove("active");
//       renderWeeklyChart();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   function formatDate(dateString) {
//     const options = { day: "2-digit", month: "2-digit", year: "numeric" };
//     return new Date(dateString).toLocaleDateString("ru-RU", options);
//   }

//   // function formatCurrency(value, currency) {
//   //   if (value >= 1000000) {
//   //     return (
//   //       (value / 1000000).toLocaleString("ru-RU", {
//   //         maximumFractionDigits: 1,
//   //       }) +
//   //       "M " +
//   //       currency.symbol
//   //     );
//   //   }
//   //   if (value >= 1000) {
//   //     return (
//   //       (value / 1000).toLocaleString("ru-RU", {
//   //         maximumFractionDigits: 1,
//   //       }) +
//   //       "K " +
//   //       currency.symbol
//   //     );
//   //   }
//   //   return (
//   //     value.toLocaleString("ru-RU", {
//   //       minimumFractionDigits: 2,
//   //       maximumFractionDigits: 2,
//   //     }) +
//   //     " " +
//   //     currency.symbol
//   //   );
//   // }

//   function getToken() {
//     return localStorage.getItem("token");
//   }

//   function formatCurrency(value, currency) {
//     return (
//       value.toLocaleString("ru-RU", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       }) +
//       " " +
//       currency.symbol
//     );
//   }
// });

// ---------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  // Глобальные переменные
  let accounts = [];
  let transactions = [];
  let totalBalance = 0;
  let mainCurrency = "RUB";
  let weeklyChart, balanceHistoryChart, accountHistoryChart;
  const token = localStorage.getItem("token");

  // Инициализация страницы
  initPage();

  // Функция инициализации страницы
  async function initPage() {
    try {
      await loadUserAccounts();
      await loadTransactions();
      updateBalancePanel();
      initCharts();
      setupEventListeners();
    } catch (error) {
      console.error("Ошибка инициализации:", error);
      showError("Не удалось загрузить данные. Пожалуйста, обновите страницу.");
    }
  }

  // Загрузка счетов пользователя
  async function loadUserAccounts() {
    try {
      const response = await fetch("http://localhost:8080/api/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки счетов");
      }

      accounts = await response.json();
      updateAccountSelects();
    } catch (error) {
      console.error("Ошибка загрузки счетов:", error);
      throw error;
    }
  }

  // Загрузка общего баланса
  async function loadTotalBalance() {
    try {
      const response = await fetch(
        "http://localhost:8080/api/accounts/total-balance",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка загрузки баланса");
      }

      const balanceData = await response.json();
      totalBalance = balanceData.totalBalance;
      mainCurrency = balanceData.mainCurrency || "RUB";

      return balanceData;
    } catch (error) {
      console.error("Ошибка загрузки баланса:", error);
      throw error;
    }
  }

  // Загрузка транзакций
  async function loadTransactions(filters = {}) {
    try {
      let url = "http://localhost:8080/api/transactions";
      const params = new URLSearchParams();

      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.category) params.append("category", filters.category);

      if (Object.keys(params).length > 0) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки транзакций");
      }

      transactions = await response.json();
      renderTransactions();
      return transactions;
    } catch (error) {
      console.error("Ошибка загрузки транзакций:", error);
      throw error;
    }
  }

  // Фильтрация транзакций
  async function filterTransactions() {
    const type = document.getElementById("type-filter").value;
    const category = document.getElementById("category-filter").value;
    const accountId = document.getElementById("account-filter").value;
    const amountMin = document.getElementById("amount-min").value;
    const amountMax = document.getElementById("amount-max").value;
    const dateStart = document.getElementById("date-start").value;
    const dateEnd = document.getElementById("date-end").value;

    try {
      let url = "http://localhost:8080/api/transactions/filter?";
      const params = new URLSearchParams();

      if (type !== "all") params.append("type", type);
      if (category !== "all") params.append("category", category);
      if (accountId !== "all") params.append("accountId", accountId);
      if (amountMin) params.append("amountMin", amountMin);
      if (amountMax) params.append("amountMax", amountMax);
      if (dateStart) params.append("dateStart", dateStart);
      if (dateEnd) params.append("dateEnd", dateEnd);

      url += params.toString();

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка фильтрации транзакций");
      }

      transactions = await response.json();
      renderTransactions();
    } catch (error) {
      console.error("Ошибка фильтрации:", error);
      showError("Не удалось применить фильтры");
    }
  }

  // Обновление панели баланса
  async function updateBalancePanel() {
    try {
      const balanceData = await loadTotalBalance();

      // Общий баланс
      document.getElementById("total-balance").textContent = formatCurrency(
        balanceData.totalBalance
      );
      document.getElementById("main-currency").textContent =
        balanceData.mainCurrency || "RUB";

      // Список счетов
      const accountsList = document.getElementById("accounts-list");
      accountsList.innerHTML = "";

      balanceData.accounts.forEach((account) => {
        const accountElement = document.createElement("div");
        accountElement.className = "account-card";
        accountElement.innerHTML = `
                    <div class="account-header">
                        <h4>${account.name}</h4>
                        <button class="btn-icon history-btn" data-account-id="${
                          account.id
                        }">
                            <i class="bx bx-history"></i>
                        </button>
                    </div>
                    <div class="account-balance">
                        ${formatCurrency(account.balance)} <span>${
          account.currency
        }</span>
                    </div>
                    <div class="account-payment-method">
                        ${getPaymentMethodDisplayName(account.paymentMethod)}
                    </div>
                `;
        accountsList.appendChild(accountElement);
      });

      // Навешиваем обработчики для кнопок истории
      document.querySelectorAll(".history-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          const accountId = this.getAttribute("data-account-id");
          showAccountHistory(accountId);
        });
      });
    } catch (error) {
      console.error("Ошибка обновления панели баланса:", error);
      showError("Не удалось обновить информацию о балансе");
    }
  }

  // Показать историю счета
  async function showAccountHistory(accountId) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/accounts/${accountId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка загрузки истории счета");
      }

      const history = await response.json();
      const account = accounts.find((a) => a.id == accountId);

      document.getElementById(
        "account-history-title"
      ).textContent = `История баланса: ${account.name}`;

      renderAccountHistoryChart(history, account);
      document.getElementById("account-history-modal").style.display = "block";
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
      showError("Не удалось загрузить историю счета");
    }
  }

  // Обновление выпадающих списков счетов
  function updateAccountSelects() {
    const accountFilter = document.getElementById("account-filter");
    const transactionAccount = document.getElementById("transaction-account");

    // Очищаем списки
    accountFilter.innerHTML = '<option value="all">Все</option>';
    transactionAccount.innerHTML = "";

    // Заполняем списки
    accounts.forEach((account) => {
      const option1 = document.createElement("option");
      option1.value = account.id;
      option1.textContent = `${account.name} (${account.currency})`;
      accountFilter.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = account.id;
      option2.textContent = `${account.name} (${account.currency})`;
      transactionAccount.appendChild(option2);
    });
  }

  // Отображение транзакций в таблице
  function renderTransactions() {
    const tbody = document.getElementById("transactions-body");
    tbody.innerHTML = "";

    if (transactions.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML =
        '<td colspan="6" class="no-transactions">Нет транзакций</td>';
      tbody.appendChild(row);
      return;
    }

    transactions.forEach((transaction) => {
      const row = document.createElement("tr");
      const account = accounts.find((a) => a.id == transaction.accountId);
      const accountName = account
        ? `${account.name} (${account.currency})`
        : "Неизвестный счет";

      row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>
                    <span class="category-badge ${transaction.category.toLowerCase()}">
                        ${getCategoryDisplayName(transaction.category)}
                    </span>
                </td>
                <td>${accountName}</td>
                <td class="${
                  transaction.type === "EXPENSE" ? "expense" : "income"
                }">
                    ${
                      transaction.type === "EXPENSE" ? "-" : "+"
                    }${formatCurrency(transaction.amount)}
                </td>
                <td>
                    <span class="type-badge ${transaction.type.toLowerCase()}">
                        ${transaction.type === "INCOME" ? "Доход" : "Расход"}
                    </span>
                </td>
                <td>
                    <button class="btn-icon edit-btn" data-id="${
                      transaction.id
                    }">
                        <i class="bx bx-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${
                      transaction.id
                    }">
                        <i class="bx bx-trash"></i>
                    </button>
                </td>
            `;

      tbody.appendChild(row);
    });

    // Навешиваем обработчики для кнопок редактирования и удаления
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const transactionId = this.getAttribute("data-id");
        editTransaction(transactionId);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const transactionId = this.getAttribute("data-id");
        deleteTransaction(transactionId);
      });
    });
  }

  // Добавление новой транзакции
  async function addTransaction(transactionData) {
    try {
      const response = await fetch("http://localhost:8080/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error("Ошибка добавления транзакции");
      }

      const newTransaction = await response.json();

      // Обновляем данные на странице
      await Promise.all([
        loadUserAccounts(),
        loadTransactions(),
        updateBalancePanel(),
      ]);

      // Закрываем модальное окно
      document.getElementById("transaction-modal").style.display = "none";

      showSuccess("Транзакция успешно добавлена");
      return newTransaction;
    } catch (error) {
      console.error("Ошибка добавления транзакции:", error);
      showError("Не удалось добавить транзакцию");
      throw error;
    }
  }

  // Редактирование транзакции
  async function editTransaction(transactionId) {
    try {
      // Загружаем данные транзакции
      const response = await fetch(
        `http://localhost:8080/api/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка загрузки транзакции");
      }

      const transaction = await response.json();

      // Заполняем форму
      document.getElementById("modal-title").textContent =
        "Редактировать транзакцию";
      document.getElementById("transaction-date").value = transaction.date;
      document.getElementById("transaction-category").value =
        transaction.category;
      document.getElementById("transaction-account").value =
        transaction.accountId;
      document.getElementById("transaction-amount").value = transaction.amount;
      document.getElementById("transaction-type").value = transaction.type;
      document.getElementById("transaction-description").value =
        transaction.description || "";

      // Показываем модальное окно
      const modal = document.getElementById("transaction-modal");
      modal.style.display = "block";

      // Меняем обработчик формы на редактирование
      const form = document.getElementById("transaction-form");
      form.onsubmit = async function (e) {
        e.preventDefault();
        await updateTransaction(transactionId, getFormData(this));
      };
    } catch (error) {
      console.error("Ошибка редактирования транзакции:", error);
      showError("Не удалось загрузить данные транзакции");
    }
  }

  // Обновление транзакции
  async function updateTransaction(transactionId, transactionData) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/transactions/${transactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transactionData),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка обновления транзакции");
      }

      const updatedTransaction = await response.json();

      // Обновляем данные на странице
      await Promise.all([
        loadUserAccounts(),
        loadTransactions(),
        updateBalancePanel(),
      ]);

      // Закрываем модальное окно
      document.getElementById("transaction-modal").style.display = "none";

      showSuccess("Транзакция успешно обновлена");
      return updatedTransaction;
    } catch (error) {
      console.error("Ошибка обновления транзакции:", error);
      showError("Не удалось обновить транзакцию");
      throw error;
    }
  }

  // Удаление транзакции
  async function deleteTransaction(transactionId) {
    if (!confirm("Вы уверены, что хотите удалить эту транзакцию?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/transactions/${transactionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка удаления транзакции");
      }

      // Обновляем данные на странице
      await Promise.all([
        loadUserAccounts(),
        loadTransactions(),
        updateBalancePanel(),
      ]);

      showSuccess("Транзакция успешно удалена");
    } catch (error) {
      console.error("Ошибка удаления транзакции:", error);
      showError("Не удалось удалить транзакцию");
    }
  }

  // Инициализация графиков
  function initCharts() {
    // График недельной статистики
    const weeklyCtx = document
      .getElementById("weeklyProgressChart")
      .getContext("2d");
    weeklyChart = new Chart(weeklyCtx, {
      type: "bar",
      data: {
        labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
        datasets: [
          {
            label: "Доходы",
            backgroundColor: "#4CAF50",
            data: [1200, 1900, 3000, 500, 2000, 300, 0],
          },
          {
            label: "Расходы",
            backgroundColor: "#F44336",
            data: [700, 1200, 800, 1500, 900, 2000, 500],
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      },
    });

    // График динамики баланса
    const balanceCtx = document
      .getElementById("balanceHistoryChart")
      .getContext("2d");
    balanceHistoryChart = new Chart(balanceCtx, {
      type: "line",
      data: {
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
        datasets: [
          {
            label: "Общий баланс",
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            data: [
              5000, 7000, 6500, 8000, 9000, 8500, 10000, 11000, 10500, 12000,
              12500, 13000,
            ],
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }

  // Отрисовка графика истории счета
  function renderAccountHistoryChart(history, account) {
    const ctx = document.getElementById("accountHistoryChart").getContext("2d");

    // Сортируем историю по дате
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Подготавливаем данные для графика
    const labels = history.map((item) => formatDate(item.date));
    const data = history.map((item) => item.balance);

    // Если график уже существует, обновляем его
    if (accountHistoryChart) {
      accountHistoryChart.data.labels = labels;
      accountHistoryChart.data.datasets[0].data = data;
      accountHistoryChart.update();
      return;
    }

    // Создаем новый график
    accountHistoryChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Баланс (${account.currency})`,
            borderColor: "#673AB7",
            backgroundColor: "rgba(103, 58, 183, 0.1)",
            data: data,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    // Кнопка добавления транзакции
    document
      .getElementById("add-transaction")
      .addEventListener("click", function () {
        document.getElementById("modal-title").textContent =
          "Добавить транзакцию";
        document.getElementById("transaction-form").reset();
        document.getElementById("transaction-date").valueAsDate = new Date();

        // Устанавливаем обработчик для добавления
        document.getElementById("transaction-form").onsubmit = function (e) {
          e.preventDefault();
          addTransaction(getFormData(this));
        };

        document.getElementById("transaction-modal").style.display = "block";
      });

    // Кнопка применения фильтров
    document
      .getElementById("apply-filters")
      .addEventListener("click", filterTransactions);

    // Кнопка сброса фильтров
    document
      .getElementById("reset-filters")
      .addEventListener("click", function () {
        document.getElementById("type-filter").value = "all";
        document.getElementById("category-filter").value = "all";
        document.getElementById("account-filter").value = "all";
        document.getElementById("amount-min").value = "";
        document.getElementById("amount-max").value = "";
        document.getElementById("date-start").value = "";
        document.getElementById("date-end").value = "";

        loadTransactions();
      });

    // Закрытие модальных окон
    document.querySelectorAll(".close-modal").forEach((btn) => {
      btn.addEventListener("click", function () {
        this.closest(".modal").style.display = "none";
      });
    });

    // Закрытие модальных окон при клике вне их
    window.addEventListener("click", function (event) {
      if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
      }
    });
  }

  // Получение данных из формы
  function getFormData(form) {
    return {
      date: form.date.value,
      category: form.category.value,
      accountId: parseInt(form.accountId.value),
      amount: parseFloat(form.amount.value),
      type: form.type.value,
      description: form.description.value,
      paymentMethod: "DEBIT_CARD", // По умолчанию, можно изменить
    };
  }

  // Вспомогательные функции форматирования
  function formatCurrency(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  }

  function getCategoryDisplayName(category) {
    const names = {
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
    return names[category] || category;
  }

  function getPaymentMethodDisplayName(paymentMethod) {
    const names = {
      CASH: "Наличные",
      DEBIT_CARD: "Дебетовая карта",
      CREDIT_CARD: "Кредитная карта",
      PREPAID_CARD: "Предоплаченная карта",
      CURRENT_ACCOUNT: "Текущий счет",
      SAVINGS_ACCOUNT: "Сберегательный счет",
      ELECTRONIC_WALLET: "Электронный кошелек",
      INVESTMENT_ACCOUNT: "Инвестиционный счет",
      BROKERAGE_ACCOUNT: "Брокерский счет",
      LOAN_ACCOUNT: "Кредитный счет",
      MORTGAGE_ACCOUNT: "Ипотечный счет",
      CRYPTOCURRENCY_WALLET: "Криптовалютный кошелек",
      OTHER: "Другое",
    };
    return names[paymentMethod] || paymentMethod;
  }

  // Уведомления
  function showSuccess(message) {
    const notification = document.createElement("div");
    notification.className =
      "notification success animate__animated animate__fadeInDown";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("animate__fadeOutUp");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }

  function showError(message) {
    const notification = document.createElement("div");
    notification.className =
      "notification error animate__animated animate__fadeInDown";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("animate__fadeOutUp");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  }
});
