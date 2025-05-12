// Функция для получения списка транзакций с фильтрами
async function fetchTransactions(filters = {}) {
  const token = localStorage.getItem("token"); // Получаем токен из localStorage

  const url = new URL("http://localhost:8080/api/transactions");
  console.log("🚀 Отправка запроса с фильтрами:", filters); // Отладка: фильтры
  console.log("🌐 URL запроса:", url.toString()); // Отладка: сформированный URL

  // Добавляем фильтры как параметры к URL
  Object.keys(filters).forEach((key) => {
    if (filters[key]) {
      url.searchParams.append(key, filters[key]);
    }
  });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`, // Отправляем токен в заголовке
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Получены транзакции:", data); // Отладка: ответ с сервера
      updateTransactionsTable(data); // Обновляем таблицу транзакций
    } else {
      console.error("❌ Ошибка запроса транзакций");
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
  }
}

function translateEnum(field, value) {
  return enumTranslations[field]?.[value] || value;
}
const enumTranslations = {
  category: {
    SALARY: "Зарплата",
    GROCERIES: "Продукты",
    TRANSPORT: "Транспорт",
    UTILITIES: "Коммунальные услуги",
    ENTERTAINMENT: "Развлечения",
    HEALTH: "Здоровье",
    INVESTMENTS: "Инвестиции",
    EDUCATION: "Образование",
  },
  type: {
    INCOME: "Доход",
    EXPENSE: "Расход",
  },
  paymentMethod: {
    CARD: "Карта",
    CASH: "Наличные",
    BANK: "Банк",
  },
};

// Функция для обновления данных на таблице транзакций
function updateTransactionsTable(data) {
  console.log("📊 Обновление таблицы, количество транзакций:", data.length); // Отладка: сколько данных пришло

  const tableBody = document.getElementById("transactions-body");
  if (!tableBody) {
    console.error("❌ Не найден элемент с id 'transactions-body'");
    return;
  }
  tableBody.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных

  if (data.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='6'>Нет транзакций для отображения</td></tr>";
    return; // Если нет транзакций, то выводим сообщение
  }

  data.forEach((transaction) => {
    console.log("🚀 Добавление транзакции в таблицу:", transaction);
    const row = document.createElement("tr");
    row.innerHTML = `
  <td>${transaction.date}</td>
  <td>${translateEnum("category", transaction.category)}</td>
  <td>${transaction.account}</td>
  <td>${transaction.amount}</td>
  <td>${translateEnum("type", transaction.type)}</td>
  <td>
    <button class="btn-edit" onclick="editTransaction(${
      transaction.id
    })">Редактировать</button>
    <button class="btn-delete" onclick="deleteTransaction(${
      transaction.id
    })">Удалить</button>
  </td>
`;
    tableBody.appendChild(row);
  });
}

// Функция для получения статистики транзакций (доходы/расходы)
async function fetchTransactionStats() {
  const token = localStorage.getItem("token"); // Получаем токен
  try {
    const response = await fetch(
      "http://localhost:8080/api/transactions/stats",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Отправляем токен
        },
      }
    );

    if (!response.ok) {
      throw new Error("❌ Ошибка при получении статистики");
    }

    const stats = await response.json();
    console.log("✅ Получена статистика транзакций:", stats); // Отладка: статистика
    updateChartData(stats); // Обновляем график
  } catch (error) {
    console.error("❌ Ошибка при получении статистики:", error);
  }
}

// Функция для обновления данных на графике
function updateChartData(stats) {
  const ctx = document.getElementById("weeklyProgressChart").getContext("2d");
  console.log("📊 Обновление данных графика с данными:", stats); // Отладка: данные для графика

  const chartData = {
    labels: stats.labels, // Месяцы или недели для графика
    datasets: [
      {
        label: "Доходы",
        data: stats.incomeData,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Расходы",
        data: stats.expenseData,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: chartOptions,
  });
}

// Функция для добавления новой транзакции
async function addTransaction(transactionData) {
  const token = localStorage.getItem("token"); // Получаем токен
  console.log("📝 Добавление транзакции с данными:", transactionData); // Отладка: данные транзакции

  try {
    const response = await fetch("http://localhost:8080/api/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error("❌ Ошибка при добавлении транзакции");
    }

    const newTransaction = await response.json();
    console.log("✅ Новая транзакция добавлена:", newTransaction);
    fetchTransactions(); // Обновляем список транзакций
  } catch (error) {
    console.error("❌ Ошибка при добавлении транзакции:", error);
  }
}

// Функция для удаления транзакции
async function deleteTransaction(transactionId) {
  const token = localStorage.getItem("token");
  console.log("🗑 Удаление транзакции с ID:", transactionId); // Отладка: ID транзакции

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
      throw new Error("❌ Ошибка при удалении транзакции");
    }

    console.log("✅ Транзакция удалена с ID:", transactionId);
    fetchTransactions(); // Обновляем список транзакций
  } catch (error) {
    console.error("❌ Ошибка при удалении транзакции:", error);
  }
}

// Функция для редактирования транзакции
async function editTransaction(transactionId) {
  const token = localStorage.getItem("token");
  console.log("✏️ Редактирование транзакции с ID:", transactionId); // Отладка: ID транзакции

  try {
    const response = await fetch(
      `http://localhost:8080/api/transactions/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("❌ Ошибка при получении транзакции для редактирования");
    }

    const transaction = await response.json();
    console.log("✅ Получены данные для редактирования:", transaction);
    fillTransactionForm(transaction); // Заполняем форму редактирования
  } catch (error) {
    console.error(
      "❌ Ошибка при получении транзакции для редактирования:",
      error
    );
  }
}

// Функция для заполнения формы редактирования
function fillTransactionForm(transaction) {
  document.getElementById("transaction-date").value = transaction.date;
  document.getElementById("transaction-category").value = transaction.category;
  document.getElementById("transaction-account").value = transaction.account;
  document.getElementById("transaction-amount").value = transaction.amount;
  document.getElementById("transaction-type").value = transaction.type;
  document.getElementById("transaction-description").value =
    transaction.description;
  document.getElementById("transaction-modal").style.display = "block"; // Показываем модальное окно
}

// Закрытие модального окна
document.querySelector(".close-modal").addEventListener("click", () => {
  document.getElementById("transaction-modal").style.display = "none";
});

// Отладка: когда страница полностью загружена
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 DOM загружен, вызываем fetchTransactions()");
  fetchTransactions(); // загружаем транзакции без фильтров
});

// document.addEventListener("DOMContentLoaded", function () {
//   // Инициализация данных
//   const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
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

//   // Категории и счета
//   const categories = [
//     "Продукты",
//     "Транспорт",
//     "Жильё",
//     "Развлечения",
//     "Зарплата",
//     "Подарки",
//     "Здоровье",
//     "Образование",
//     "Другое",
//   ];

//   const accounts = ["Карта", "Наличные", "Криптовалюта", "Другое"];

//   // Инициализация дат фильтра
//   const today = new Date();
//   const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//   const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//   dateStart.valueAsDate = firstDayOfMonth;
//   dateEnd.valueAsDate = lastDayOfMonth;

//   // Инициализация приложения
//   init();

//   function init() {
//     // Загрузка демо-данных, если нет сохраненных
//     if (transactions.length === 0) {
//       loadDemoData();
//     }

//     setupEventListeners();
//     renderTransactions();
//     renderWeeklyChart();
//   }

//   function setupEventListeners() {
//     // Переключение валюты
//     currencyToggle.addEventListener("click", toggleCurrency);

//     // Кнопки добавления/закрытия
//     addTransactionBtn.addEventListener("click", () =>
//       openModal("Добавить транзакцию")
//     );

//     document.querySelectorAll(".close-modal").forEach((btn) => {
//       btn.addEventListener("click", closeModal);
//     });

//     // Форма транзакции
//     transactionForm.addEventListener("submit", handleFormSubmit);

//     // Фильтры
//     applyFiltersBtn.addEventListener("click", renderTransactions);
//     resetFiltersBtn.addEventListener("click", resetFilters);

//     // Делегирование событий для кнопок в таблице
//     tbody.addEventListener("click", handleTableClick);
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

//   function handleFormSubmit(e) {
//     e.preventDefault();
//     const formData = Object.fromEntries(new FormData(transactionForm));
//     saveTransaction(formData);
//   }

//   function toggleCurrency() {
//     currentCurrencyIndex = (currentCurrencyIndex + 1) % currencies.length;
//     currencyToggle.textContent = currencies[currentCurrencyIndex].symbol;
//     renderTransactions();
//     renderWeeklyChart();
//   }

//   function resetFilters() {
//     typeFilter.value = "all";
//     categoryFilter.value = "all";
//     accountFilter.value = "all";
//     amountMin.value = "";
//     amountMax.value = "";
//     dateStart.valueAsDate = firstDayOfMonth;
//     dateEnd.valueAsDate = lastDayOfMonth;
//     renderTransactions();
//   }

//   // Рендер транзакций
//   function renderTransactions() {
//     const filteredTransactions = filterTransactions();
//     tbody.innerHTML = "";

//     const currency = currencies[currentCurrencyIndex];
//     const averageExpense = calculateAverageExpense(filteredTransactions);

//     if (filteredTransactions.length === 0) {
//       tbody.innerHTML = `
//         <tr>
//           <td colspan="6" class="no-transactions">Нет транзакций, соответствующих выбранным фильтрам</td>
//         </tr>
//       `;
//       return;
//     }

//     filteredTransactions.forEach((t) => {
//       const tr = document.createElement("tr");
//       const convertedAmount = t.amount * currency.rate;
//       const highlightClass =
//         t.type === "expense" && t.amount > averageExpense ? "highlight" : "";

//       tr.innerHTML = `
//         <td>${formatDate(t.date)}</td>
//         <td>${t.category}</td>
//         <td>${t.account}</td>
//         <td class="${t.type} ${highlightClass}">${formatCurrency(
//         convertedAmount,
//         currency
//       )}</td>
//         <td><span class="transaction-type ${t.type}">${
//         t.type === "income" ? "Доход" : "Расход"
//       }</span></td>
//         <td class="actions">
//           <button class="edit" data-id="${
//             t.id
//           }"><i class="bx bx-edit"></i></button>
//           <button class="delete" data-id="${
//             t.id
//           }"><i class="bx bx-trash"></i></button>
//         </td>
//       `;
//       tbody.appendChild(tr);
//     });
//   }

//   // Фильтрация транзакций
//   function filterTransactions() {
//     return transactions.filter((t) => {
//       // Фильтр по типу
//       if (typeFilter.value !== "all" && t.type !== typeFilter.value)
//         return false;

//       // Фильтр по категории
//       if (categoryFilter.value !== "all" && t.category !== categoryFilter.value)
//         return false;

//       // Фильтр по счету
//       if (accountFilter.value !== "all" && t.account !== accountFilter.value)
//         return false;

//       // Фильтр по сумме
//       const amount = t.amount;
//       if (amountMin.value && amount < parseFloat(amountMin.value)) return false;
//       if (amountMax.value && amount > parseFloat(amountMax.value)) return false;

//       // Фильтр по дате
//       const transactionDate = new Date(t.date);
//       const startDate = dateStart.valueAsDate;
//       const endDate = dateEnd.valueAsDate;

//       if (startDate && transactionDate < startDate) return false;
//       if (endDate && transactionDate > endDate) return false;

//       return true;
//     });
//   }

//   // Расчет среднего расхода
//   function calculateAverageExpense(transactionsList) {
//     const expenses = transactionsList
//       .filter((t) => t.type === "expense")
//       .map((t) => t.amount);

//     return expenses.length > 0
//       ? expenses.reduce((sum, amount) => sum + amount, 0) / expenses.length
//       : 0;
//   }

//   // Форматирование даты
//   function formatDate(dateString) {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("ru-RU");
//   }

//   // Форматирование валюты
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

//   // Рендер графика
//   function renderWeeklyChart() {
//     const currency = currencies[currentCurrencyIndex];
//     const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
//     const daysData = Array(7).fill(0);

//     // Группировка по дням недели
//     transactions.forEach((t) => {
//       const day = new Date(t.date).getDay(); // 0-6 (Вс-Сб)
//       const index = day === 0 ? 6 : day - 1; // Преобразуем к Пн-Вс (0-6)
//       const convertedAmount = t.amount * currency.rate;
//       daysData[index] +=
//         t.type === "income" ? convertedAmount : -convertedAmount;
//     });

//     const ctx = document.getElementById("weeklyProgressChart").getContext("2d");

//     // Удаляем предыдущий график, если он существует
//     if (window.weeklyChart) {
//       window.weeklyChart.destroy();
//     }

//     window.weeklyChart = new Chart(ctx, {
//       type: "bar",
//       data: {
//         labels: labels,
//         datasets: [
//           {
//             label: "Баланс",
//             data: daysData,
//             backgroundColor: daysData.map((val) =>
//               val >= 0 ? "#2ecc71" : "#e74c3c"
//             ),
//             borderColor: daysData.map((val) =>
//               val >= 0 ? "#2ecc71" : "#e74c3c"
//             ),
//             borderWidth: 1,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             display: false,
//           },
//           tooltip: {
//             callbacks: {
//               label: function (context) {
//                 let label = context.dataset.label || "";
//                 if (label) label += ": ";
//                 label += formatCurrency(context.raw, currency);
//                 return label;
//               },
//             },
//           },
//         },
//         scales: {
//           y: {
//             beginAtZero: false,
//             ticks: {
//               callback: function (value) {
//                 return formatCurrency(value, currency);
//               },
//             },
//           },
//         },
//       },
//     });
//   }

//   // Загрузка демо-данных
//   function loadDemoData() {
//     const demoTransactions = [
//       {
//         id: Date.now(),
//         date: new Date().toISOString().split("T")[0],
//         category: "Зарплата",
//         account: "Карта",
//         amount: 85000,
//         type: "income",
//         description: "Зарплата за апрель",
//       },
//       {
//         id: Date.now() + 1,
//         date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
//         category: "Продукты",
//         account: "Карта",
//         amount: 3450,
//         type: "expense",
//         description: "Продукты на неделю",
//       },
//       {
//         id: Date.now() + 2,
//         date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
//         category: "Транспорт",
//         account: "Наличные",
//         amount: 1200,
//         type: "expense",
//         description: "Такси до работы",
//       },
//       {
//         id: Date.now() + 3,
//         date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
//         category: "Развлечения",
//         account: "Карта",
//         amount: 2500,
//         type: "expense",
//         description: "Кино",
//       },
//       {
//         id: Date.now() + 4,
//         date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
//         category: "Подарки",
//         account: "Карта",
//         amount: 5000,
//         type: "expense",
//         description: "Подарок на день рождения",
//       },
//     ];

//     demoTransactions.forEach((t) => transactions.push(t));
//     saveTransactions();
//   }

//   // Сохранение транзакций в localStorage
//   function saveTransactions() {
//     localStorage.setItem("transactions", JSON.stringify(transactions));
//   }

//   // Работа с модальным окном
//   function openModal(title, transaction = null) {
//     document.getElementById("modal-title").textContent = title;
//     currentEditingId = transaction ? transaction.id : null;

//     if (transaction) {
//       // Заполняем форму данными транзакции
//       document.getElementById("transaction-date").value = transaction.date;
//       document.getElementById("transaction-category").value =
//         transaction.category;
//       document.getElementById("transaction-account").value =
//         transaction.account;
//       document.getElementById("transaction-amount").value = transaction.amount;
//       document.getElementById("transaction-type").value = transaction.type;
//       document.getElementById("transaction-description").value =
//         transaction.description || "";
//     } else {
//       // Сбрасываем форму для новой транзакции
//       transactionForm.reset();
//       document.getElementById("transaction-date").valueAsDate = new Date();
//     }

//     modal.classList.add("active");
//   }

//   function closeModal() {
//     modal.classList.remove("active");
//     currentEditingId = null;
//   }

//   function saveTransaction(formData) {
//     // Валидация
//     if (!formData.date || !formData.category || !formData.amount) {
//       alert("Пожалуйста, заполните все обязательные поля");
//       return;
//     }

//     const amount = parseFloat(formData.amount);
//     if (isNaN(amount)) {
//       alert("Сумма должна быть числом");
//       return;
//     }

//     const transaction = {
//       id: currentEditingId || Date.now(),
//       date: formData.date,
//       category: formData.category,
//       account: formData.account,
//       amount: Math.abs(amount),
//       type: formData.type,
//       description: formData.description || "",
//     };

//     if (currentEditingId) {
//       // Редактирование
//       const index = transactions.findIndex((t) => t.id == currentEditingId);
//       if (index !== -1) {
//         transactions[index] = transaction;
//       }
//     } else {
//       // Добавление
//       transactions.push(transaction);
//     }

//     saveTransactions();
//     renderTransactions();
//     renderWeeklyChart();
//     closeModal();
//   }

//   function editTransaction(id) {
//     const transaction = transactions.find((t) => t.id == id);
//     if (transaction) {
//       openModal("Редактировать транзакцию", transaction);
//     } else {
//       console.error("Транзакция не найдена:", id);
//     }
//   }

//   function deleteTransaction(id) {
//     if (confirm("Вы уверены, что хотите удалить эту транзакцию?")) {
//       const index = transactions.findIndex((t) => t.id == id);
//       if (index !== -1) {
//         transactions.splice(index, 1);
//         saveTransactions();
//         renderTransactions();
//         renderWeeklyChart();
//       }
//     }
//   }
// });

////-----------------------------------------------------------/////


@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700&display=swap");

:root {
  --primary: #2041ff;
  --primary-hover: #1a35e0;
  --secondary: #a0c4da;
  --accent: #e7adcd;
  --light: #efe8e0;
  --dark: #2c3e50;
  --white: #ffffff;
  --light-bg: #f8f9fa;
  --gray: #7f8c8d;
  --success: #2ecc71;
  --danger: #e74c3c;
  --warning: #f39c12;
  --border-radius: 12px;
  --box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Inter", Tahoma, Geneva, Verdana, sans-serif;
}

/* Основные стили */
.main-content.goals-page {
  position: relative;
  min-height: calc(100vh - 80px);
  top: 80px;
  left: 250px;
  width: calc(100% - 250px);
  padding: 40px;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
  background: var(--light-bg);
}

.goals-container {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 32px;
  box-shadow: var(--box-shadow);
}

/* Шапка страницы */
.goals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.goals-header h2 {
  font-family: "Manrope", sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--dark);
}

/* Кнопка добавления цели */
.add-goal-btn {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(32, 65, 255, 0.25);
}

.add-goal-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(32, 65, 255, 0.3);
}

.add-goal-btn i {
  font-size: 18px;
}
#add-goal.btn-primary {
  height: 36px;
  padding: 8px 16px;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

#add-goal.btn-primary:hover {
  background-color: #1d4ed8;
}
/* Список целей */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--gray);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--light);
}

.empty-state p {
  font-size: 16px;
}

/* Карточка цели */
.goal-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: var(--box-shadow);
  transition: var(--transition);
  border-left: 4px solid var(--primary);
}

.goal-card.completed {
  border-left-color: var(--success);
}

.goal-card.overdue {
  border-left-color: var(--danger);
}

.goal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.goal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.goal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark);
}

.goal-type {
  font-size: 14px;
  padding: 4px 12px;
  background: var(--light-bg);
  color: var(--primary);
  border-radius: 20px;
  font-weight: 500;
}

/* Прогресс цели */
.goal-progress {
  margin: 20px 0;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--light-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.5s ease;
}

.progress-fill.completed {
  background: var(--success);
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--dark);
}

/* Детали цели */
.goal-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.goal-detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-detail i {
  color: var(--primary);
  font-size: 18px;
}

.goal-detail-label {
  font-size: 14px;
  color: var(--gray);
}

.goal-detail-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--dark);
}

/* Кнопки действий */
.goal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.goal-btn {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-complete {
  background: var(--success);
  color: white;
  border: none;
}

.btn-complete:hover {
  background: #27ae60;
}

.btn-edit {
  background: var(--light-bg);
  color: var(--primary);
  border: none;
}

.btn-edit:hover {
  background: var(--primary);
  color: white;
}

.btn-delete {
  background: none;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.btn-delete:hover {
  background: var(--danger);
  color: white;
}

/* Статистика целей */
.goals-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--box-shadow);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-icon.completed {
  background: var(--success);
}

.stat-icon.active {
  background: var(--primary);
}

.stat-icon.overdue {
  background: var(--danger);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
}

.stat-label {
  font-size: 14px;
  color: var(--gray);
}

/* Модальное окно */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: var(--transition);
  backdrop-filter: blur(4px);
}

.modal.active {
  display: flex;
  opacity: 1;
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 32px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-header {
  margin-bottom: 24px;
}

.modal-header h3 {
  font-family: "Manrope", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--dark);
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--dark);
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--light-bg);
  border-radius: var(--border-radius);
  font-size: 15px;
  transition: var(--transition);
  background: var(--white);
}

.form-control:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(32, 65, 255, 0.1);
}

/* Иконки в полях формы */
.input-with-icon {
  position: relative;
}

.input-with-icon i {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary);
}

.input-with-icon input,
.input-with-icon select {
  padding-left: 42px;
}

/* Кнопки модального окна */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.close-modal {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 24px;
  color: var(--gray);
  cursor: pointer;
  transition: var(--transition);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-modal:hover {
  color: var(--dark);
  background: var(--light-bg);
}
.btn-primary {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 100px;
  text-align: center;
}

.btn-primary:hover {
  background-color: #3e8e41;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(1px);
}
.btn-secondary {
  padding: 10px 20px;
  color: var(--gray);
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  text-align: center;
  font-family: "Inter", sans-serif;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-secondary:active {
  transform: translateY(1px);
}
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slide-in 0.3s ease-out;
  transition: opacity 0.3s;
}

.notification.success {
  background: #2ecc71;
}

.notification.error {
  background: #e74c3c;
}

.notification.info {
  background: #3498db;
}

.notification.fade-out {
  opacity: 0;
}

/* Стили для статусов целей */
.goal-card.completed {
  border-left-color: var(--success);
  background-color: rgba(46, 204, 113, 0.05);
}

.goal-card.overdue {
  border-left-color: var(--danger);
  background-color: rgba(231, 76, 60, 0.05);
}

.status-icon {
  font-size: 24px;
  margin-right: 12px;
}

.status-icon.completed {
  color: var(--success);
}

.status-icon.overdue {
  color: var(--danger);
}

.status-icon.active {
  color: var(--primary);
}

.goal-card-header {
  display: flex;
  align-items: center;
}

.goal-header-content {
  flex: 1;
}

.completed-badge {
  background: var(--success);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.goals-section {
  margin-bottom: 32px;
}

.goals-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.count-badge {
  background: #e0e0e0;
  color: var(--dark);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.goals-container-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.completed-section .goals-container-section {
  opacity: 0.9;
}

.overdue-section .goals-section-header {
  color: var(--danger);
}

.active-section .goals-section-header {
  color: var(--primary);
}

.completed-section .goals-section-header {
  color: var(--success);
}

.goals-section {
  margin-bottom: 32px;
}

.goals-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.goals-section-header.completed {
  color: var(--success);
}

.goals-section-header.overdue {
  color: var(--danger);
}

.goals-section-header.active {
  color: var(--primary);
}

.count-badge {
  background: #e0e0e0;
  color: var(--dark);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.goals-container-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.completed-section .goals-container-section {
  opacity: 0.9;
}

/* Добавим эти стили в ваш CSS */
.goal-card.completed {
  border-left: 4px solid var(--success);
  background-color: rgba(46, 204, 113, 0.05);
}

.goal-card.completed .progress-fill {
  background-color: var(--success);
}

.completed-section .goal-card {
  opacity: 0.9;
}

.completed-badge {
  background-color: var(--success);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.goal-card.overdue {
  border-left-color: var(--danger);
  background-color: rgba(231, 76, 60, 0.05);
}

.progress-fill.completed {
  background: var(--success);
}

.progress-fill.overdue {
  background: var(--danger);
}

.text-overdue {
  color: var(--danger);
  font-weight: 600;
}

@keyframes slide-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Анимация */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 992px) {
  .main-content.goals-page {
    left: 70px;
    width: calc(100% - 70px);
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .goal-details {
    grid-template-columns: 1fr;
  }

  .goals-stats {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .goal-actions {
    flex-direction: column;
  }

  .goal-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .main-content.goals-page {
    padding: 16px;
  }

  .goals-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .add-goal-btn {
    width: 100%;
    justify-content: center;
  }
}
