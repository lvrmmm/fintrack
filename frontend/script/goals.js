document.addEventListener("DOMContentLoaded", function () {
  // Конфигурация API
  const API_BASE_URL = "http://localhost:8080/api/goals";
  let authToken = localStorage.getItem("token");

  // Элементы DOM
  const goalsList = document.getElementById("goals-list");
  const addGoalBtn = document.getElementById("add-goal");
  const goalModal = document.getElementById("goal-modal");
  const goalForm = document.getElementById("goal-form");
  const modalTitle = document.getElementById("modal-title");
  const closeModalBtns = document.querySelectorAll(".close-modal");

  // Статистика
  const completedGoalsEl = document.getElementById("completed-goals");
  const activeGoalsEl = document.getElementById("active-goals");
  const overdueGoalsEl = document.getElementById("overdue-goals");

  let allGoals = [];
  let currentEditingGoalId = null;

  // Инициализация
  checkAuth();
  loadGoals();
  setupEventListeners();

  function checkAuth() {
    if (!authToken) {
      window.location.href = "/frontend/sign-in.html";
    }
  }

  function setupEventListeners() {
    addGoalBtn.addEventListener("click", () => {
      currentEditingGoalId = null;
      modalTitle.textContent = "Добавить цель";
      goalForm.reset();
      goalModal.classList.add("active");
    });

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        goalModal.classList.remove("active");
      });
    });

    goalForm.addEventListener("submit", handleGoalFormSubmit);

    window.addEventListener("click", (e) => {
      if (e.target === goalModal) {
        goalModal.classList.remove("active");
      }
    });
  }

  async function loadGoals() {
    try {
      const response = await fetchWithAuth(API_BASE_URL);
      allGoals = await response.json();

      // Нормализация данных
      allGoals = allGoals.map((goal) => ({
        ...goal,
        isCompleted: goal.isCompleted || false,
        deadline: goal.deadline || new Date().toISOString(),
        currentAmount: goal.currentAmount || 0,
      }));

      renderGoals(allGoals);
      loadStats();
    } catch (error) {
      showNotification("Ошибка загрузки целей", "error");
      console.error("Error loading goals:", error);
    }
  }

  async function loadStats() {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/stats`);
      const stats = await response.json();

      completedGoalsEl.textContent = stats.completed || 0;
      activeGoalsEl.textContent = stats.active || 0;
      overdueGoalsEl.textContent = stats.overdue || 0;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  function renderGoals(goals = allGoals) {
    goalsList.innerHTML = "";

    const now = new Date();

    // Группируем цели по статусам
    const completedGoals = goals.filter((goal) => goal.isCompleted === true);
    const overdueGoals = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return !goal.isCompleted && deadline < now;
    });
    const activeGoals = goals.filter((goal) => {
      const deadline = new Date(goal.deadline);
      return !goal.isCompleted && deadline >= now;
    });

    // Рендерим секции в правильном порядке
    renderGoalsSection(
      overdueGoals,
      "Просроченные цели",
      "bx-error-circle",
      "overdue"
    );
    renderGoalsSection(activeGoals, "Активные цели", "bx-time", "active");
    renderGoalsSection(
      completedGoals,
      "Завершенные цели",
      "bx-check-circle",
      "completed"
    );

    if (goals.length === 0) {
      goalsList.innerHTML = `
      <div class="empty-state">
        <i class="bx bx-target-lock"></i>
        <p>У вас пока нет финансовых целей</p>
      </div>
    `;
    }
  }

  function renderGoalsSection(goals, title, icon, statusClass) {
    if (goals.length === 0) return;

    const sectionHeader = document.createElement("h3");
    sectionHeader.className = `goals-section-header ${statusClass}`;
    sectionHeader.innerHTML = `<i class="bx ${icon}"></i> ${title}`;
    goalsList.appendChild(sectionHeader);

    goals.forEach((goal) => {
      goalsList.appendChild(createGoalCard(goal));
    });
  }

  function createGoalCard(goal) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const isCompleted = goal.isCompleted === true;
    const isOverdue = !isCompleted && deadline < now;

    const progress = isCompleted
      ? 100
      : goal.currentAmount && goal.targetAmount
      ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
      : 0;

    const daysLeft = isCompleted
      ? null
      : Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    const goalCard = document.createElement("div");
    goalCard.className = `goal-card ${isCompleted ? "completed" : ""} ${
      isOverdue ? "overdue" : ""
    }`;

    goalCard.innerHTML = `
    <div class="goal-card-header">
      ${
        isCompleted
          ? '<i class="bx bx-check-circle status-icon completed"></i>'
          : isOverdue
          ? '<i class="bx bx-error-circle status-icon overdue"></i>'
          : '<i class="bx bx-time status-icon active"></i>'
      }
      <div class="goal-header-content">
        <h3 class="goal-title">${goal.name}</h3>
        <span class="goal-type">${getGoalTypeText(goal.type)}</span>
      </div>
    </div>
    
    <div class="goal-progress">
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill ${
            isCompleted ? "completed" : isOverdue ? "overdue" : ""
          }" 
               style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress.toFixed(1)}%</span>
      </div>
      <p class="progress-details">
        ${formatCurrency(goal.currentAmount)} / ${formatCurrency(
      goal.targetAmount
    )}
        ${isCompleted ? '<span class="completed-badge">Выполнено</span>' : ""}
      </p>
    </div>
    
    <div class="goal-details">
      <div class="goal-detail">
        <i class="bx bx-calendar"></i>
        <div>
          <span class="goal-detail-label">Срок выполнения</span>
          <span class="goal-detail-value">${formatDate(goal.deadline)}</span>
        </div>
      </div>
      
      ${
        !isCompleted
          ? `
        <div class="goal-detail">
          <i class="bx bx-time"></i>
          <div>
            <span class="goal-detail-label">Осталось дней</span>
            <span class="goal-detail-value ${isOverdue ? "overdue" : ""}">
              ${daysLeft >= 0 ? daysLeft : "Просрочено"}
            </span>
          </div>
        </div>
      `
          : ""
      }
      
      <div class="goal-actions">
        ${
          !isCompleted
            ? `
          <button class="goal-btn btn-complete" data-id="${goal.id}">
            <i class="bx bx-check"></i> Завершить
          </button>
          <button class="goal-btn btn-edit" data-id="${goal.id}">
            <i class="bx bx-edit"></i> Редактировать
          </button>
        `
            : ""
        }
        <button class="goal-btn btn-delete" data-id="${goal.id}">
          <i class="bx bx-trash"></i> Удалить
        </button>
      </div>
    </div>
  `;

    // Навешиваем обработчики событий
    if (!isCompleted) {
      goalCard
        .querySelector(".btn-complete")
        .addEventListener("click", () => completeGoal(goal.id));
      goalCard
        .querySelector(".btn-edit")
        .addEventListener("click", () => openEditModal(goal));
    }
    goalCard
      .querySelector(".btn-delete")
      .addEventListener("click", () => deleteGoal(goal.id));

    return goalCard;
  }

  function openEditModal(goal) {
    currentEditingGoalId = goal.id;
    modalTitle.textContent = "Редактировать цель";

    // Заполняем форму данными цели
    document.getElementById("goal-title").value = goal.name;
    document.getElementById("goal-type").value = goal.type || "SAVING";
    document.getElementById("goal-target").value = goal.targetAmount;
    document.getElementById("goal-current").value = goal.currentAmount || 0;
    document.getElementById("goal-deadline").value =
      goal.deadline.split("T")[0]; // Форматируем дату для input[type=date]
    document.getElementById("goal-priority").value = goal.priority || "MEDIUM";
    document.getElementById("goal-notes").value = goal.notes || "";

    goalModal.classList.add("active");
  }

  async function handleGoalFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(goalForm);
    const goalData = {
      name: formData.get("title"),
      type: formData.get("type"),
      targetAmount: parseFloat(formData.get("target")),
      currentAmount: parseFloat(formData.get("current")) || 0,
      deadline: formData.get("deadline"),
      priority: formData.get("priority"),
      notes: formData.get("notes"),
    };

    try {
      if (currentEditingGoalId) {
        await updateGoal(currentEditingGoalId, goalData);
        showNotification("Цель успешно обновлена", "success");
      } else {
        await createGoal(goalData);
        showNotification("Цель успешно создана", "success");
      }

      goalModal.classList.remove("active");
      loadGoals(); // Перезагружаем цели с сервера
    } catch (error) {
      console.error("Error saving goal:", error);
      showNotification(
        "Ошибка сохранения цели: " + (error.message || "неизвестная ошибка"),
        "error"
      );
    }
  }

  async function createGoal(goalData) {
    const response = await fetchWithAuth(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Ошибка создания цели");
    }

    return await response.json();
  }

  async function updateGoal(id, goalData) {
    const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goalData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Ошибка обновления цели");
    }

    return await response.json();
  }

  async function deleteGoal(id) {
    if (!confirm("Вы уверены, что хотите удалить эту цель?")) return;

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении цели");
      }

      showNotification("Цель успешно удалена", "success");
      loadGoals(); // Перезагружаем цели с сервера
    } catch (error) {
      console.error("Error deleting goal:", error);
      showNotification(error.message || "Ошибка удаления цели", "error");
    }
  }

  async function completeGoal(id) {
    try {
      // Получаем текущую цель с сервера
      const response = await fetchWithAuth(`${API_BASE_URL}/${id}/complete`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Ошибка завершения цели");
      }

      showNotification("Цель успешно завершена!", "success");
      loadGoals(); // Перезагружаем цели с сервера
    } catch (error) {
      console.error("Error completing goal:", error);
      showNotification(error.message || "Ошибка завершения цели", "error");
    }
  }

  async function fetchWithAuth(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      // Неавторизован - перенаправляем на страницу входа
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Ошибка запроса");
    }

    return response;
  }

  // Вспомогательные функции
  function formatCurrency(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  function formatDate(dateString) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  function getGoalTypeText(type) {
    const types = {
      SAVING: "Накопления",
      DEBT: "Погашение долга",
      PURCHASE: "Крупная покупка",
      OTHER: "Другое",
    };
    return types[type] || type;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="bx ${
        type === "success"
          ? "bx-check-circle"
          : type === "error"
          ? "bx-error-circle"
          : "bx-info-circle"
      }"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
});
