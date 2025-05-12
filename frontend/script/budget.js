// // budget.js
// document.addEventListener("DOMContentLoaded", function () {
//   // Данные
//   const colors = [
//     "#2041ff",
//     "#2ecc71",
//     "#e74c3c",
//     "#f39c12",
//     "#9b59b6",
//     "#1abc9c",
//     "#e67e22",
//     "#3498db",
//     "#7f8c8d",
//     "#e7adcd",
//   ];

//   const currencies = [
//     { code: "RUB", symbol: "₽", rate: 1 },
//     { code: "USD", symbol: "$", rate: 0.011 },
//     { code: "EUR", symbol: "€", rate: 0.01 },
//   ];

//   let currentCurrency = currencies[0];
//   let budgetData = [];
//   let userCategories = [];
//   let notifications = [];
//   let currentMonth = "";

//   // Элементы DOM
//   const budgetCategoriesEl = document.querySelector(".budget-categories");
//   const addCategoryBtn = document.getElementById("add-category");
//   const categoryModal = document.getElementById("category-modal");
//   const categorySelect = document.getElementById("category-select");
//   const categoryLimitInput = document.getElementById("category-limit");
//   const saveCategoryBtn = document.getElementById("save-category");
//   const cancelCategoryBtn = document.getElementById("cancel-category");
//   const closeModalBtn = document.querySelector(".close-modal");
//   const currencyToggle = document.getElementById("currency-toggle");
//   const monthSelect = document.getElementById("month-select");
//   const exportReportBtn = document.getElementById("export-report");
//   const notificationBadge = document.querySelector(".notification-badge");
//   const notificationsDropdown = document.querySelector(
//     ".notifications-dropdown"
//   );
//   const statValues = document.querySelectorAll(".stat-value");

//   // Инициализация страницы
//   initPage();

//   // Функции
//   function initPage() {
//     loadUserCategories();
//     populateMonths();
//     initChart();
//     loadBudgetData();
//     setupEventListeners();
//   }

//   function loadUserCategories() {
//     // В реальном приложении будет запрос к API
//     userCategories = [
//       "Продукты",
//       "Транспорт",
//       "Жильё",
//       "Развлечения",
//       "Здоровье",
//       "Образование",
//       "Подарки",
//       "Другое",
//     ];
//   }

//   function populateMonths() {
//     // Генерируем список месяцев (текущий + 11 предыдущих)
//     const months = [];
//     const date = new Date();

//     for (let i = 0; i < 12; i++) {
//       const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
//       const value = `${monthDate.getFullYear()}-${String(
//         monthDate.getMonth() + 1
//       ).padStart(2, "0")}`;
//       const label = monthDate.toLocaleDateString("ru-RU", {
//         month: "long",
//         year: "numeric",
//       });

//       months.push({ value, label });

//       // Устанавливаем текущий месяц
//       if (i === 0) {
//         currentMonth = value;
//       }
//     }

//     months.forEach((month) => {
//       const option = document.createElement("option");
//       option.value = month.value;
//       option.textContent = month.label;
//       if (month.value === currentMonth) {
//         option.selected = true;
//       }
//       monthSelect.appendChild(option);
//     });
//   }

//   function loadBudgetData() {
//     // В реальном приложении будет запрос к API с currentMonth
//     const testData = [
//       { category: "Продукты", limit: 15000, spent: 13250 },
//       { category: "Транспорт", limit: 5000, spent: 4200 },
//       { category: "Жильё", limit: 20000, spent: 21000 },
//       { category: "Развлечения", limit: 8000, spent: 9500 },
//     ];

//     budgetData = testData;
//     renderCategories();
//     checkBudgetLimits();
//   }

//   function renderCategories() {
//     budgetCategoriesEl.innerHTML = "";

//     // Объединяем категории из бюджета и транзакций
//     const allCategories = [
//       ...new Set([
//         ...userCategories,
//         ...budgetData.map((item) => item.category),
//       ]),
//     ];

//     if (allCategories.length === 0) {
//       budgetCategoriesEl.innerHTML = `
//         <div class="empty-state">
//           <i class="bx bx-wallet"></i>
//           <p>Добавьте категории для отслеживания бюджета</p>
//         </div>
//       `;
//       return;
//     }

//     updateStats();

//     allCategories.forEach((category, index) => {
//       const budgetItem = budgetData.find((item) => item.category === category);
//       const hasLimit = !!budgetItem;
//       const limit = hasLimit ? budgetItem.limit : 0;
//       const spent = hasLimit ? budgetItem.spent : 0;
//       const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
//       const progressClass =
//         progress >= 100 ? "danger" : progress >= 85 ? "warning" : "success";
//       const isOverLimit = progress >= 100;

//       const categoryEl = document.createElement("div");
//       categoryEl.className = `budget-category ${
//         isOverLimit ? "over-limit" : ""
//       }`;
//       categoryEl.innerHTML = `
//         <div class="category-icon">
//           <i class="bx bx-category-${index}"></i>
//         </div>
//         <div class="category-info">
//           <div class="category-name">${category}</div>
//           ${
//             hasLimit
//               ? `
//           <div class="category-progress">
//             <div class="category-progress-bar ${progressClass}"
//                  style="width: ${progress}%; background: ${
//                   colors[index % colors.length]
//                 }"></div>
//           </div>
//           `
//               : ""
//           }
//         </div>
//         <div class="category-amount">
//           ${
//             hasLimit
//               ? `
//           <input type="number" class="category-limit" value="${limit}"
//                  data-category="${category}" placeholder="0">
//           <div class="category-spent">Потрачено: ${formatCurrency(spent)}</div>
//           `
//               : `
//           <button class="btn-secondary set-limit-btn" data-category="${category}">
//             <i class="bx bx-plus"></i> Установить лимит
//           </button>
//           `
//           }
//         </div>
//         ${
//           hasLimit
//             ? `
//         <div class="category-remove">
//           <i class="bx bx-trash"></i>
//         </div>
//         `
//             : ""
//         }
//       `;

//       budgetCategoriesEl.appendChild(categoryEl);
//     });

//     updateChart();
//   }

//   function updateStats() {
//     const budgetItems = budgetData.filter((item) => item.limit > 0);
//     const inBudget = budgetItems.filter(
//       (item) => item.spent / item.limit < 1
//     ).length;
//     const exceeded = budgetItems.filter(
//       (item) => item.spent / item.limit >= 1
//     ).length;
//     const savings = budgetItems.reduce(
//       (sum, item) => sum + Math.max(0, item.limit - item.spent),
//       0
//     );

//     statValues[0].textContent = inBudget;
//     statValues[1].textContent = exceeded;
//     statValues[2].textContent = formatCurrency(savings);
//   }

//   function initChart() {
//     const ctx = document.getElementById("budgetChart").getContext("2d");
//     window.budgetChart = new Chart(ctx, {
//       type: "polarArea",
//       data: {
//         labels: [],
//         datasets: [
//           {
//             data: [],
//             backgroundColor: colors,
//             borderWidth: 0,
//           },
//         ],
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//           legend: {
//             position: "right",
//             labels: {
//               boxWidth: 12,
//               padding: 16,
//               font: {
//                 size: 12,
//               },
//             },
//           },
//           tooltip: {
//             callbacks: {
//               label: function (context) {
//                 const label = context.label || "";
//                 const value = context.raw || 0;
//                 return `${label}: ${formatCurrency(value)}`;
//               },
//             },
//           },
//         },
//       },
//     });
//   }

//   function updateChart() {
//     const categoriesWithSpending = budgetData.filter((item) => item.spent > 0);

//     if (categoriesWithSpending.length === 0) {
//       document.querySelector(".chart-container").innerHTML = `
//         <div class="empty-state">
//           <i class="bx bx-pie-chart-alt"></i>
//           <p>Нет данных для построения графика</p>
//         </div>
//       `;
//       return;
//     }

//     if (!document.getElementById("budgetChart")) {
//       document.querySelector(".chart-container").innerHTML = `
//         <canvas id="budgetChart"></canvas>
//       `;
//       initChart();
//     }

//     const labels = categoriesWithSpending.map((item) => item.category);
//     const data = categoriesWithSpending.map((item) => item.spent);

//     window.budgetChart.data.labels = labels;
//     window.budgetChart.data.datasets[0].data = data;
//     window.budgetChart.update();
//   }

//   function formatCurrency(value) {
//     const convertedValue = value * currentCurrency.rate;
//     return (
//       new Intl.NumberFormat("ru-RU", {
//         style: "decimal",
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       }).format(convertedValue) + ` ${currentCurrency.symbol}`
//     );
//   }

//   function toggleCurrency() {
//     const currentIndex = currencies.findIndex(
//       (c) => c.code === currentCurrency.code
//     );
//     const nextIndex = (currentIndex + 1) % currencies.length;
//     currentCurrency = currencies[nextIndex];

//     currencyToggle.textContent = currentCurrency.symbol;
//     renderCategories();
//   }

//   function checkBudgetLimits() {
//     notifications = [];

//     budgetData.forEach((item) => {
//       if (item.limit <= 0) return;

//       const progress = (item.spent / item.limit) * 100;
//       if (progress >= 85) {
//         notifications.push({
//           category: item.category,
//           progress: Math.round(progress),
//           isExceeded: progress >= 100,
//         });
//       }
//     });

//     updateNotifications();
//   }

//   function updateNotifications() {
//     notificationBadge.textContent = notifications.length;

//     if (notifications.length === 0) {
//       notificationsDropdown.innerHTML =
//         '<div class="notification-item"><p>Нет новых уведомлений</p></div>';
//       return;
//     }

//     notificationsDropdown.innerHTML = "";

//     notifications.forEach((notification) => {
//       const notificationItem = document.createElement("div");
//       notificationItem.className = `notification-item ${
//         notification.isExceeded ? "danger" : "warning"
//       }`;

//       notificationItem.innerHTML = `
//         <i class="bx ${notification.isExceeded ? "bx-error" : "bx-wallet"}"></i>
//         <p>Категория "${notification.category}" потрачена на ${
//         notification.progress
//       }%</p>
//       `;

//       notificationsDropdown.appendChild(notificationItem);
//     });
//   }

//   function exportReport() {
//     // В реальном приложении здесь будет генерация PDF
//     alert(
//       `Отчет за ${
//         monthSelect.options[monthSelect.selectedIndex].text
//       } будет сгенерирован`
//     );

//     // Пример использования jsPDF (нужно подключить библиотеку)
//     /*
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();

//     doc.text(`Отчет по бюджету за ${monthSelect.options[monthSelect.selectedIndex].text}`, 10, 10);
//     doc.text(`Валюта: ${currentCurrency.code}`, 10, 20);

//     // Добавление данных
//     let y = 30;
//     budgetData.forEach(item => {
//       doc.text(`${item.category}: ${formatCurrency(item.spent)} / ${formatCurrency(item.limit)}`, 10, y);
//       y += 10;
//     });

//     doc.save(`Бюджет_${currentMonth}.pdf`);
//     */
//   }

//   function setupEventListeners() {
//     // Открытие модального окна
//     addCategoryBtn.addEventListener("click", () => {
//       populateCategorySelect();
//       categoryModal.classList.add("active");
//     });

//     // Закрытие модального окна
//     closeModalBtn.addEventListener("click", closeModal);
//     cancelCategoryBtn.addEventListener("click", closeModal);

//     // Сохранение категории
//     saveCategoryBtn.addEventListener("click", () => {
//       const category = categorySelect.value;
//       const limit = parseFloat(categoryLimitInput.value);

//       if (!category || isNaN(limit) || limit <= 0) {
//         alert("Пожалуйста, укажите корректную сумму лимита");
//         return;
//       }

//       const existingIndex = budgetData.findIndex(
//         (item) => item.category === category
//       );
//       if (existingIndex >= 0) {
//         budgetData[existingIndex].limit = limit;
//       } else {
//         budgetData.push({
//           category,
//           limit,
//           spent: 0,
//         });
//       }

//       closeModal();
//       renderCategories();
//       checkBudgetLimits();
//     });

//     // Переключение валюты
//     currencyToggle.addEventListener("click", toggleCurrency);

//     // Изменение месяца
//     monthSelect.addEventListener("change", function () {
//       currentMonth = this.value;
//       loadBudgetData(); // В реальном приложении будет загрузка данных для выбранного месяца
//     });

//     // Удаление категории
//     budgetCategoriesEl.addEventListener("click", function (e) {
//       if (e.target.closest(".category-remove")) {
//         const categoryEl = e.target.closest(".budget-category");
//         const categoryName =
//           categoryEl.querySelector(".category-name").textContent;

//         budgetData = budgetData.filter(
//           (item) => item.category !== categoryName
//         );
//         renderCategories();
//         checkBudgetLimits();
//       }
//     });

//     // Изменение лимита категории
//     budgetCategoriesEl.addEventListener("change", function (e) {
//       if (e.target.classList.contains("category-limit")) {
//         const category = e.target.dataset.category;
//         const newLimit = parseFloat(e.target.value);

//         if (isNaN(newLimit) || newLimit <= 0) {
//           alert("Лимит должен быть положительным числом");
//           return;
//         }

//         const categoryItem = budgetData.find(
//           (item) => item.category === category
//         );
//         if (categoryItem) {
//           categoryItem.limit = newLimit;
//           renderCategories();
//           checkBudgetLimits();
//         }
//       }
//     });

//     // Установка лимита для новой категории
//     budgetCategoriesEl.addEventListener("click", function (e) {
//       if (e.target.closest(".set-limit-btn")) {
//         const category = e.target.closest(".set-limit-btn").dataset.category;

//         populateCategorySelect();
//         categorySelect.value = category;
//         categoryLimitInput.focus();
//         categoryModal.classList.add("active");
//       }
//     });

//     // Экспорт отчета
//     exportReportBtn.addEventListener("click", exportReport);
//   }

//   function populateCategorySelect() {
//     categorySelect.innerHTML = '<option value="">Выберите категорию</option>';

//     const categoriesWithoutLimit = userCategories.filter(
//       (cat) => !budgetData.some((item) => item.category === cat)
//     );

//     categoriesWithoutLimit.forEach((category) => {
//       const option = document.createElement("option");
//       option.value = category;
//       option.textContent = category;
//       categorySelect.appendChild(option);
//     });
//   }

//   function closeModal() {
//     categoryModal.classList.remove("active");
//     categorySelect.value = "";
//     categoryLimitInput.value = "";
//   }
// });

//////////////////////////////////////////////////////////////////

// // budget.js
// document.addEventListener("DOMContentLoaded", function() {
//   // Конфигурация
//   const colors = [
//       "#2041ff", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6",
//       "#1abc9c", "#e67e22", "#3498db", "#7f8c8d", "#e7adcd"
//   ];

//   const currencies = [
//       { code: "RUB", symbol: "₽", rate: 1 },
//       { code: "USD", symbol: "$", rate: 0.011 },
//       { code: "EUR", symbol: "€", rate: 0.01 }
//   ];

//   // Состояние приложения
//   let state = {
//       currentCurrency: currencies[0],
//       budgetData: [],
//       userCategories: ["Продукты", "Транспорт", "Жильё", "Развлечения", "Здоровье", "Образование", "Подарки", "Другое"],
//       notifications: [],
//       currentMonth: ""
//   };

//   // DOM элементы
//   const elements = {
//       budgetCategories: document.querySelector(".budget-categories"),
//       addCategoryBtn: document.getElementById("add-category"),
//       categoryModal: document.getElementById("category-modal"),
//       categorySelect: document.getElementById("category-select"),
//       categoryLimit: document.getElementById("category-limit"),
//       saveCategoryBtn: document.getElementById("save-category"),
//       cancelCategoryBtn: document.getElementById("cancel-category"),
//       closeModalBtn: document.querySelector(".close-modal"),
//       currencyToggle: document.getElementById("currency-toggle"),
//       monthSelect: document.getElementById("month-select"),
//       exportReportBtn: document.getElementById("export-report"),
//       notificationBadge: document.querySelector(".notification-badge"),
//       notificationsDropdown: document.querySelector(".notifications-dropdown"),
//       statValues: document.querySelectorAll(".stat-value"),
//       chart: null
//   };

//   // Инициализация приложения
//   function init() {
//       setupEventListeners();
//       generateMonths();
//       loadBudgetData();
//       initChart();
//   }

//   // Генерация месяцев для выпадающего списка
//   function generateMonths() {
//       const months = [];
//       const date = new Date();

//       for (let i = 0; i < 12; i++) {
//           const monthDate = new Date(date.getFullYear(), date.getMonth() - i, 1);
//           const value = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
//           const label = monthDate.toLocaleDateString('ru-RU', {
//               month: 'long',
//               year: 'numeric'
//           });

//           months.push({ value, label });

//           if (i === 0) {
//               state.currentMonth = value;
//           }
//       }

//       months.forEach(month => {
//           const option = document.createElement("option");
//           option.value = month.value;
//           option.textContent = month.label;
//           if (month.value === state.currentMonth) option.selected = true;
//           elements.monthSelect.appendChild(option);
//       });
//   }

//   // Загрузка данных бюджета (заглушка)
//   function loadBudgetData() {
//       // В реальном приложении будет запрос к API с state.currentMonth
//       const testData = [
//           { category: "Продукты", limit: 15000, spent: 13250 },
//           { category: "Транспорт", limit: 5000, spent: 4200 },
//           { category: "Жильё", limit: 20000, spent: 21000 },
//           { category: "Развлечения", limit: 8000, spent: 9500 },
//       ];

//       state.budgetData = testData;
//       renderCategories();
//       checkBudgetLimits();
//   }

//   // Отрисовка категорий
//   function renderCategories() {
//       elements.budgetCategories.innerHTML = "";

//       // Объединяем категории из бюджета и транзакций
//       const allCategories = [...new Set([...state.userCategories, ...state.budgetData.map(item => item.category)])];

//       if (allCategories.length === 0) {
//           elements.budgetCategories.innerHTML = `
//               <div class="empty-state">
//                   <i class="bx bx-wallet"></i>
//                   <p>Добавьте категории для отслеживания бюджета</p>
//               </div>
//           `;
//           return;
//       }

//       updateStats();

//       allCategories.forEach((category, index) => {
//           const budgetItem = state.budgetData.find(item => item.category === category);
//           const hasLimit = !!budgetItem;
//           const limit = hasLimit ? budgetItem.limit : 0;
//           const spent = hasLimit ? budgetItem.spent : 0;
//           const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
//           const progressClass = progress >= 100 ? "danger" : progress >= 85 ? "warning" : "success";
//           const isOverLimit = progress >= 100;

//           const categoryEl = document.createElement("div");
//           categoryEl.className = `budget-category ${isOverLimit ? 'over-limit' : ''}`;
//           categoryEl.innerHTML = `
//               <div class="category-icon">
//                   <i class="bx bx-category-${index}"></i>
//               </div>
//               <div class="category-info">
//                   <div class="category-name">${category}</div>
//                   ${hasLimit ? `
//                   <div class="category-progress">
//                       <div class="category-progress-bar ${progressClass}"
//                            style="width: ${progress}%; background: ${colors[index % colors.length]}"></div>
//                   </div>
//                   ` : ''}
//               </div>
//               <div class="category-amount">
//                   ${hasLimit ? `
//                   <input type="number" class="category-limit" value="${limit}"
//                          data-category="${category}" placeholder="0">
//                   <div class="category-spent">Потрачено: ${formatCurrency(spent)}</div>
//                   ` : `
//                   <button class="btn-secondary set-limit-btn" data-category="${category}">
//                       <i class="bx bx-plus"></i> Установить лимит
//                   </button>
//                   `}
//               </div>
//               ${hasLimit ? `
//               <div class="category-remove">
//                   <i class="bx bx-trash"></i>
//               </div>
//               ` : ''}
//           `;

//           elements.budgetCategories.appendChild(categoryEl);
//       });

//       updateChart();
//   }

//   // Обновление статистики
//   function updateStats() {
//       const budgetItems = state.budgetData.filter(item => item.limit > 0);
//       const inBudget = budgetItems.filter(item => (item.spent / item.limit) < 1).length;
//       const exceeded = budgetItems.filter(item => (item.spent / item.limit) >= 1).length;
//       const savings = budgetItems.reduce((sum, item) => sum + Math.max(0, item.limit - item.spent), 0);

//       elements.statValues[0].textContent = inBudget;
//       elements.statValues[1].textContent = exceeded;
//       elements.statValues[2].textContent = formatCurrency(savings);
//   }

//   // Инициализация графика
//   function initChart() {
//       const ctx = document.getElementById("budgetChart").getContext("2d");
//       state.chart = new Chart(ctx, {
//           type: "polarArea",
//           data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0 }] },
//           options: {
//               responsive: true,
//               maintainAspectRatio: false,
//               plugins: {
//                   legend: {
//                       position: "right",
//                       labels: { boxWidth: 12, padding: 16, font: { size: 12 } }
//                   },
//                   tooltip: {
//                       callbacks: {
//                           label: context => `${context.label}: ${formatCurrency(context.raw)}`
//                       }
//                   }
//               }
//           }
//       });
//   }

//   // Обновление графика
//   function updateChart() {
//       const categoriesWithSpending = state.budgetData.filter(item => item.spent > 0);

//       if (categoriesWithSpending.length === 0) {
//           document.querySelector(".chart-container").innerHTML = `
//               <div class="empty-state">
//                   <i class="bx bx-pie-chart-alt"></i>
//                   <p>Нет данных для построения графика</p>
//               </div>
//           `;
//           return;
//       }

//       if (!document.getElementById("budgetChart")) {
//           document.querySelector(".chart-container").innerHTML = `<canvas id="budgetChart"></canvas>`;
//           initChart();
//       }

//       const labels = categoriesWithSpending.map(item => item.category);
//       const data = categoriesWithSpending.map(item => item.spent);

//       state.chart.data.labels = labels;
//       state.chart.data.datasets[0].data = data;
//       state.chart.update();
//   }

//   // Форматирование валюты
//   function formatCurrency(value) {
//       const convertedValue = value * state.currentCurrency.rate;
//       return new Intl.NumberFormat("ru-RU", {
//           style: "decimal",
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2
//       }).format(convertedValue) + ` ${state.currentCurrency.symbol}`;
//   }

//   // Проверка превышения лимитов
//   function checkBudgetLimits() {
//       state.notifications = [];

//       state.budgetData.forEach(item => {
//           if (item.limit <= 0) return;

//           const progress = (item.spent / item.limit) * 100;
//           if (progress >= 85) {
//               state.notifications.push({
//                   category: item.category,
//                   progress: Math.round(progress),
//                   isExceeded: progress >= 100
//               });
//           }
//       });

//       updateNotifications();
//   }

//   // Обновление уведомлений
//   function updateNotifications() {
//       elements.notificationBadge.textContent = state.notifications.length;

//       if (state.notifications.length === 0) {
//           elements.notificationsDropdown.innerHTML = '<div class="notification-item"><p>Нет новых уведомлений</p></div>';
//           return;
//       }

//       elements.notificationsDropdown.innerHTML = '';

//       state.notifications.forEach(notification => {
//           const notificationItem = document.createElement("div");
//           notificationItem.className = `notification-item ${notification.isExceeded ? 'danger' : 'warning'}`;

//           notificationItem.innerHTML = `
//               <i class="bx ${notification.isExceeded ? 'bx-error' : 'bx-wallet'}"></i>
//               <p>Категория "${notification.category}" потрачена на ${notification.progress}%</p>
//           `;

//           elements.notificationsDropdown.appendChild(notificationItem);
//       });
//   }

//   // Экспорт отчета
//   function exportReport() {
//       // В реальном приложении здесь будет генерация PDF
//       alert(`Отчет за ${elements.monthSelect.options[elements.monthSelect.selectedIndex].text} будет сгенерирован`);

//       // Пример использования jsPDF:
//       /*
//       const { jsPDF } = window.jspdf;
//       const doc = new jsPDF();

//       doc.text(`Отчет по бюджету за ${elements.monthSelect.options[elements.monthSelect.selectedIndex].text}`, 10, 10);
//       doc.text(`Валюта: ${state.currentCurrency.code}`, 10, 20);

//       // Добавление данных
//       let y = 30;
//       state.budgetData.forEach(item => {
//           doc.text(`${item.category}: ${formatCurrency(item.spent)} / ${formatCurrency(item.limit)}`, 10, y);
//           y += 10;
//       });

//       doc.save(`Бюджет_${state.currentMonth}.pdf`);
//       */
//   }

//   // Наполнение списка категорий
//   function populateCategorySelect() {
//       elements.categorySelect.innerHTML = '<option value="">Выберите категорию</option>';

//       const categoriesWithoutLimit = state.userCategories.filter(cat =>
//           !state.budgetData.some(item => item.category === cat)
//       );

//       categoriesWithoutLimit.forEach(category => {
//           const option = document.createElement("option");
//           option.value = category;
//           option.textContent = category;
//           elements.categorySelect.appendChild(option);
//       });
//   }

//   // Закрытие модального окна
//   function closeModal() {
//       elements.categoryModal.classList.remove("active");
//       elements.categorySelect.value = "";
//       elements.categoryLimit.value = "";
//   }

//   // Переключение валюты
//   function toggleCurrency() {
//       const currentIndex = currencies.findIndex(c => c.code === state.currentCurrency.code);
//       const nextIndex = (currentIndex + 1) % currencies.length;
//       state.currentCurrency = currencies[nextIndex];

//       elements.currencyToggle.textContent = state.currentCurrency.symbol;
//       renderCategories();
//   }

//   // Настройка обработчиков событий
//   function setupEventListeners() {
//       elements.addCategoryBtn.addEventListener("click", () => {
//           populateCategorySelect();
//           elements.categoryModal.classList.add("active");
//       });

//       elements.closeModalBtn.addEventListener("click", closeModal);
//       elements.cancelCategoryBtn.addEventListener("click", closeModal);

//       elements.saveCategoryBtn.addEventListener("click", () => {
//           const category = elements.categorySelect.value;
//           const limit = parseFloat(elements.categoryLimit.value);

//           if (!category || isNaN(limit) || limit <= 0) {
//               alert("Пожалуйста, укажите корректную сумму лимита");
//               return;
//           }

//           const existingIndex = state.budgetData.findIndex(item => item.category === category);
//           if (existingIndex >= 0) {
//               state.budgetData[existingIndex].limit = limit;
//           } else {
//               state.budgetData.push({ category, limit, spent: 0 });
//           }

//           closeModal();
//           renderCategories();
//           checkBudgetLimits();
//       });

//       elements.currencyToggle.addEventListener("click", toggleCurrency);

//       elements.monthSelect.addEventListener("change", function() {
//           state.currentMonth = this.value;
//           loadBudgetData();
//       });

//       elements.exportReportBtn.addEventListener("click", exportReport);

//       elements.budgetCategories.addEventListener("click", function(e) {
//           if (e.target.closest(".category-remove")) {
//               const categoryEl = e.target.closest(".budget-category");
//               const categoryName = categoryEl.querySelector(".category-name").textContent;

//               state.budgetData = state.budgetData.filter(item => item.category !== categoryName);
//               renderCategories();
//               checkBudgetLimits();
//           }
//       });

//       elements.budgetCategories.addEventListener("change", function(e) {
//           if (e.target.classList.contains("category-limit")) {
//               const category = e.target.dataset.category;
//               const newLimit = parseFloat(e.target.value);

//               if (isNaN(newLimit) return;

//               const categoryItem = state.budgetData.find(item => item.category === category);
//               if (categoryItem) {
//                   categoryItem.limit = newLimit;
//                   renderCategories();
//                   checkBudgetLimits();
//               }
//           }
//       });

//       elements.budgetCategories.addEventListener("click", function(e) {
//           if (e.target.closest(".set-limit-btn")) {
//               const category = e.target.closest(".set-limit-btn").dataset.category;
//               populateCategorySelect();
//               elements.categorySelect.value = category;
//               elements.categoryLimit.focus();
//               elements.categoryModal.classList.add("active");
//           }
//       });
//   }

//   // Запуск приложения
//   init();
// });

document.addEventListener("DOMContentLoaded", function () {
  console.log(localStorage.getItem("token"));
  // Конфигурация
  const config = {
    apiBaseUrl: "http://localhost:8080/api/budget",
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
      SALARY: "bx-money",
      GROCERIES: "bx-shopping-bag",
      TRANSPORT: "bx-car",
      UTILITIES: "bx-home",
      ENTERTAINMENT: "bx-movie-play",
      HEALTH: "bx-plus-medical",
      EDUCATION: "bx-book",
      CLOTHING: "bx-t-shirt",
      TRAVEL: "bx-plane",
      INVESTMENTS: "bx-trending-up",
      OTHER: "bx-category",
    },
    categoryNames: {
      SALARY: "Зарплата",
      GROCERIES: "Продукты",
      TRANSPORT: "Транспорт",
      UTILITIES: "Коммунальные",
      ENTERTAINMENT: "Развлечения",
      HEALTH: "Здоровье",
      EDUCATION: "Образование",
      CLOTHING: "Одежда",
      TRAVEL: "Путешествия",
      INVESTMENTS: "Инвестиции",
      OTHER: "Другое",
    },
  };

  // Состояние приложения
  const state = {
    currentCurrency: config.currencies[0],
    budgetData: [],
    currentMonth: "",
    isLoading: false,
    notifications: [],
  };

  // Элементы DOM
  const elements = {
    budgetCategories: document.querySelector(".budget-categories"),
    addCategoryBtn: document.getElementById("add-category"),
    categoryModal: document.getElementById("category-modal"),
    categorySelect: document.getElementById("category-select"),
    categoryLimit: document.getElementById("category-limit"),
    saveCategoryBtn: document.getElementById("save-category"),
    cancelCategoryBtn: document.getElementById("cancel-category"),
    closeModalBtn: document.querySelector(".close-modal"),
    currencyToggle: document.getElementById("currency-toggle"),
    monthSelect: document.getElementById("month-select"),
    exportReportBtn: document.getElementById("export-report"),
    notificationBadge: document.querySelector(".notification-badge"),
    notificationsDropdown: document.querySelector(".notifications-dropdown"),
    statValues: document.querySelectorAll(".stat-value"),
    notification: document.getElementById("notification"),
    budgetChart: null,
  };

  // Инициализация приложения
  initApp();

  // Основные функции
  async function initApp() {
    setupEventListeners();
    await loadInitialData();
  }

  async function loadInitialData() {
    showLoading();
    try {
      await populateMonths();
      await loadBudgetData();
    } catch (error) {
      showNotification("Ошибка загрузки данных", "error");
      console.error("Initialization error:", error);
    } finally {
      hideLoading();
    }
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
      const response = await fetch(
        `${config.apiBaseUrl}?month=${state.currentMonth}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Ошибка загрузки бюджета");

      const data = await response.json();
      state.budgetData = data.map((item) => ({
        category: item.category,
        limit: item.limit,
        spent: item.spent || 0,
        remaining: item.remaining || 0,
        progressPercentage: item.progressPercentage || 0,
        isOverLimit: item.isOverLimit || false,
      }));

      renderCategories();
      checkBudgetLimits();
      updateChart();
    } catch (error) {
      showNotification("Не удалось загрузить данные бюджета", "error");
      console.error("Budget load error:", error);
    } finally {
      hideLoading();
    }
  }

  function renderCategories() {
    elements.budgetCategories.innerHTML = "";

    if (state.budgetData.length === 0) {
      elements.budgetCategories.innerHTML = `
                <div class="empty-state">
                    <i class="bx bx-wallet"></i>
                    <p>Добавьте категории для отслеживания бюджета</p>
                </div>
            `;
      return;
    }

    updateStats();

    state.budgetData.forEach((item, index) => {
      const categoryEl = document.createElement("div");
      categoryEl.className = `budget-category ${
        item.isOverLimit ? "over-limit" : ""
      }`;

      const progressClass = item.isOverLimit
        ? "danger"
        : item.progressPercentage >= 85
        ? "warning"
        : "success";

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
                             style="width: ${Math.min(
                               100,
                               item.progressPercentage
                             )}%; 
                             background: ${
                               config.colors[index % config.colors.length]
                             }">
                        </div>
                    </div>
                </div>
                <div class="category-amount">
                    <input type="number" class="category-limit" value="${
                      item.limit
                    }" 
                           data-category="${
                             item.category
                           }" placeholder="0" min="0" step="100">
                    <div class="category-spent">Потрачено: ${formatCurrency(
                      item.spent
                    )}</div>
                    <div class="category-remaining">Остаток: ${formatCurrency(
                      item.remaining
                    )}</div>
                </div>
                <div class="category-remove">
                    <i class="bx bx-trash"></i>
                </div>
            `;

      elements.budgetCategories.appendChild(categoryEl);
    });
  }

  async function saveBudgetLimit(category, limit) {
    showLoading();
    try {
      const response = await fetch(config.apiBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          category,
          limit,
          month: state.currentMonth,
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
    };

    state.budgetData.forEach((item) => {
      if (item.limit > 0) {
        if (item.isOverLimit) {
          stats.exceeded++;
        } else {
          stats.inBudget++;
          stats.savings += item.remaining;
        }
      }
    });

    elements.statValues[0].textContent = stats.inBudget;
    elements.statValues[1].textContent = stats.exceeded;
    elements.statValues[2].textContent = formatCurrency(stats.savings);
  }

  function initChart() {
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
                const label = context.label || "";
                const value = context.raw || 0;
                return `${label}: ${formatCurrency(value)}`;
              },
            },
          },
        },
      },
    });
  }

  function updateChart() {
    const categoriesWithSpending = state.budgetData.filter(
      (item) => item.spent > 0
    );

    if (categoriesWithSpending.length === 0) {
      document.querySelector(".chart-container").innerHTML = `
                <div class="empty-state">
                    <i class="bx bx-pie-chart-alt"></i>
                    <p>Нет данных для построения графика</p>
                </div>
            `;
      return;
    }

    if (!state.budgetChart) {
      initChart();
    }

    const labels = categoriesWithSpending.map(
      (item) => config.categoryNames[item.category] || item.category
    );
    const data = categoriesWithSpending.map((item) => item.spent);

    state.budgetChart.data.labels = labels;
    state.budgetChart.data.datasets[0].data = data;
    state.budgetChart.update();
  }

  function checkBudgetLimits() {
    state.notifications = [];

    state.budgetData.forEach((item) => {
      if (item.limit <= 0) return;

      if (item.isOverLimit) {
        state.notifications.push({
          category: item.category,
          progress: item.progressPercentage,
          isExceeded: true,
          message: `Превышен лимит по категории "${
            config.categoryNames[item.category]
          }"`,
        });
      } else if (item.progressPercentage >= 85) {
        state.notifications.push({
          category: item.category,
          progress: item.progressPercentage,
          isExceeded: false,
          message: `Лимит по категории "${
            config.categoryNames[item.category]
          }" почти исчерпан`,
        });
      }
    });

    updateNotifications();
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

    // Получаем все категории из enum, которые еще не имеют лимита
    const availableCategories = Object.keys(config.categoryNames).filter(
      (category) => !state.budgetData.some((item) => item.category === category)
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
    const convertedValue = value * state.currentCurrency.rate;
    return (
      new Intl.NumberFormat("ru-RU", {
        style: "decimal",
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
    elements.categoryModal.classList.remove("active");
    elements.categorySelect.value = "";
    elements.categoryLimit.value = "";
  }

  // Обработчики событий
  function setupEventListeners() {
    // Открытие модального окна
    elements.addCategoryBtn.addEventListener("click", () => {
      populateCategorySelect();
      elements.categoryModal.classList.add("active");
    });

    // Закрытие модального окна
    elements.closeModalBtn.addEventListener("click", closeModal);
    elements.cancelCategoryBtn.addEventListener("click", closeModal);

    // Сохранение категории
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

    // Удаление категории
    elements.budgetCategories.addEventListener("click", async function (e) {
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

    // Изменение лимита категории
    elements.budgetCategories.addEventListener("change", async function (e) {
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
          const item = state.budgetData.find((i) => i.category === category);
          if (item) e.target.value = item.limit;
        }
      }
    });

    // Экспорт отчета
    elements.exportReportBtn.addEventListener("click", exportReport);

    // Клик вне модального окна
    window.addEventListener("click", (e) => {
      if (e.target === elements.categoryModal) {
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
