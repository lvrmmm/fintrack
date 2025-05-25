document.addEventListener("DOMContentLoaded", function () {
  const apiBaseUrl = "http://localhost:8080";
  const token = localStorage.getItem("token"); // Получаем токен из localStorage

  // Проверка авторизации
  if (!token) {
    window.location.href = "/frontend/sign-in.html"; // Перенаправляем на страницу входа, если токена нет
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const goalsList = document.getElementById("goals-list");
  const addGoalBtn = document.getElementById("add-goal");
  const goalModal = document.getElementById("goal-modal");
  const closeModalBtn = document.querySelector(".close-modal");
  const goalForm = document.getElementById("goal-form");
  const modalTitle = document.getElementById("modal-title");
  const completedGoalsEl = document.getElementById("completed-goals");
  const activeGoalsEl = document.getElementById("active-goals");
  const overdueGoalsEl = document.getElementById("overdue-goals");

  let currentGoalId = null;
  let isEditMode = false;

  addGoalBtn.addEventListener("click", openAddGoalModal);
  closeModalBtn.addEventListener("click", closeModal);
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  goalForm.addEventListener("submit", handleGoalSubmit);

  fetchGoals();
  fetchStats();

  function openAddGoalModal() {
    isEditMode = false;
    currentGoalId = null;
    modalTitle.textContent = "Добавить цель";
    goalForm.reset();
    document.getElementById("goal-current").value = "0";
    openModal();
  }

  function openEditGoalModal(goal) {
    isEditMode = true;
    currentGoalId = goal.id;
    modalTitle.textContent = "Редактировать цель";

    // Fill the form with goal data
    document.getElementById("goal-title").value = goal.name;
    document.getElementById("goal-type").value = goal.type;
    document.getElementById("goal-target").value = goal.targetAmount;
    document.getElementById("goal-current").value = goal.currentAmount;
    document.getElementById("goal-deadline").value = goal.deadline;
    document.getElementById("goal-priority").value = goal.priority;
    document.getElementById("goal-notes").value = goal.notes || "";

    openModal();
  }

  function openModal() {
    goalModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    goalModal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  async function handleGoalSubmit(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("goal-title").value,
      type: document.getElementById("goal-type").value,
      targetAmount: parseFloat(document.getElementById("goal-target").value),
      currentAmount:
        parseFloat(document.getElementById("goal-current").value) || 0,
      deadline: document.getElementById("goal-deadline").value,
      priority: document.getElementById("goal-priority").value,
      notes: document.getElementById("goal-notes").value,
    };

    try {
      if (isEditMode) {
        await updateGoal(currentGoalId, formData);
      } else {
        await createGoal(formData);
      }

      closeModal();
      fetchGoals();
      fetchStats();
    } catch (error) {
      console.error("Error saving goal:", error);
      alert("Произошла ошибка при сохранении цели");
    }
  }

  async function fetchGoals() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/goals`, {
        headers: headers,
      });

      if (response.status === 401) {
        window.location.href = "/frontend/sign-in.html";
        return;
      }

      if (!response.ok) throw new Error("Network response was not ok");

      const goals = await response.json();
      renderGoals(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      goalsList.innerHTML =
        '<p class="error">Не удалось загрузить цели. Пожалуйста, попробуйте позже.</p>';
    }
  }

  function renderGoals(goals) {
    if (goals.length === 0) {
      goalsList.innerHTML =
        '<p class="no-goals">У вас пока нет финансовых целей. Нажмите "Добавить цель", чтобы создать первую.</p>';
      return;
    }

    goals.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      const now = new Date();
      const aDeadline = new Date(a.deadline);
      const bDeadline = new Date(b.deadline);

      if (aDeadline < now && bDeadline >= now) return -1;
      if (aDeadline >= now && bDeadline < now) return 1;

      return aDeadline - bDeadline;
    });

    goalsList.innerHTML = goals.map((goal) => createGoalCard(goal)).join("");

    document.querySelectorAll(".btn-complete").forEach((btn) => {
      btn.addEventListener("click", handleCompleteGoal);
    });

    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", handleEditGoal);
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", handleDeleteGoal);
    });
  }

  function createGoalCard(goal) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const isOverdue = !goal.completed && deadline < now;
    const progressPercentage = Math.min(
      100,
      (goal.currentAmount / goal.targetAmount) * 100
    );

    let cardClass = "goal-card";
    if (goal.completed) {
      cardClass += " completed";
    } else if (isOverdue) {
      cardClass += " overdue";
    } else {
      cardClass += " active";
    }

    return `
            <div class="${cardClass}" data-id="${goal.id}">
                <div class="goal-card-header">
                    <h3 class="goal-title">${goal.name}</h3>
                    <span class="goal-priority priority-${
                      goal.priority
                    }">${getPriorityLabel(goal.priority)}</span>
                </div>
                
                <div class="goal-meta">
                    <span class="goal-type">${getTypeLabel(goal.type)}</span>
                    <span class="goal-deadline">
                        <i class="bx bx-calendar"></i>
                        ${formatDate(goal.deadline)}
                    </span>
                </div>
                
                <div class="goal-progress-container">
                    <div class="progress-info">
                        <span class="progress-amount">${formatCurrency(
                          goal.currentAmount
                        )} / ${formatCurrency(goal.targetAmount)}</span>
                        <span>${progressPercentage.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                
                ${
                  goal.notes
                    ? `<div class="goal-notes">${goal.notes}</div>`
                    : ""
                }
                
                <div class="goal-actions">
                    <button class="btn-complete" ${
                      goal.completed ? "disabled" : ""
                    }>
                        <i class="bx bx-check"></i> ${
                          goal.completed ? "Завершена" : "Завершить"
                        }
                    </button>
                    <div class="action-buttons">
                        <button class="btn-edit">
                            <i class="bx bx-edit"></i> Изменить
                        </button>
                        <button class="btn-delete">
                            <i class="bx bx-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  async function createGoal(goalData) {
    const response = await fetch(`${apiBaseUrl}/api/goals`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(goalData),
    });

    if (response.status === 401) {
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to create goal");

    return await response.json();
  }

  async function updateGoal(id, goalData) {
    const response = await fetch(`${apiBaseUrl}/api/goals/${id}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(goalData),
    });

    if (response.status === 401) {
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to update goal");

    return await response.json();
  }

  async function deleteGoal(id) {
    const response = await fetch(`${apiBaseUrl}/api/goals/${id}`, {
      method: "DELETE",
      headers: headers,
    });

    if (response.status === 401) {
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to delete goal");
  }

  async function completeGoal(id) {
    const response = await fetch(`${apiBaseUrl}/api/goals/${id}/complete`, {
      method: "PUT",
      headers: headers,
    });

    if (response.status === 401) {
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) throw new Error("Failed to complete goal");

    return await response.json();
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/goals/stats`, {
        headers: headers,
      });

      if (response.status === 401) {
        window.location.href = "/frontend/sign-in.html";
        return;
      }

      if (!response.ok) throw new Error("Network response was not ok");

      const stats = await response.json();
      updateStatsUI(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  function updateStatsUI(stats) {
    completedGoalsEl.textContent = stats.completed || 0;
    activeGoalsEl.textContent = stats.active || 0;
    overdueGoalsEl.textContent = stats.overdue || 0;
  }

  async function handleCompleteGoal(e) {
    const goalCard = e.target.closest(".goal-card");
    const goalId = goalCard.dataset.id;

    try {
      // Сначала получаем текущие данные цели
      const response = await fetch(`${apiBaseUrl}/api/goals/${goalId}`, {
        headers: headers,
      });

      if (response.status === 401) {
        window.location.href = "/frontend/login.html";
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch goal data");

      const goal = await response.json();

      // Обновляем текущую сумму до целевой
      const updatedGoalData = {
        ...goal,
        currentAmount: goal.targetAmount,
        completed: true,
      };

      // Отправляем обновленные данные
      const updateResponse = await fetch(`${apiBaseUrl}/api/goals/${goalId}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(updatedGoalData),
      });

      if (!updateResponse.ok) throw new Error("Failed to complete goal");

      // Обновляем интерфейс
      goalCard.classList.add("completed");
      goalCard.classList.remove("active", "overdue");

      const progressFill = goalCard.querySelector(".progress-fill");
      progressFill.style.width = "100%";
      progressFill.style.backgroundColor = "var(--success)";

      const progressAmount = goalCard.querySelector(".progress-amount");
      progressAmount.textContent = `${formatCurrency(
        goal.targetAmount
      )} / ${formatCurrency(goal.targetAmount)}`;

      const completeBtn = goalCard.querySelector(".btn-complete");
      completeBtn.disabled = true;
      completeBtn.innerHTML = '<i class="bx bx-check"></i> Завершена';

      // Обновляем статистику
      fetchStats();

      // Показываем уведомление об успехе
      showSuccessNotification("Цель успешно завершена!");
    } catch (error) {
      console.error("Error completing goal:", error);
      showErrorNotification(
        "Не удалось завершить цель. Пожалуйста, попробуйте позже."
      );
    }
  }

  function showSuccessNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification success";
    notification.innerHTML = `
        <i class="bx bx-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function showErrorNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification error";
    notification.innerHTML = `
        <i class="bx bx-error-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async function handleEditGoal(e) {
    const goalCard = e.target.closest(".goal-card");
    const goalId = goalCard.dataset.id;

    try {
      const response = await fetch(`${apiBaseUrl}/api/goals/${goalId}`, {
        headers: headers,
      });

      if (response.status === 401) {
        window.location.href = "/frontend/sign-in.html";
        return;
      }

      if (!response.ok) throw new Error("Network response was not ok");

      const goal = await response.json();
      openEditGoalModal(goal);
    } catch (error) {
      console.error("Error fetching goal for edit:", error);
      alert("Не удалось загрузить данные цели для редактирования");
    }
  }

  async function handleDeleteGoal(e) {
    if (!confirm("Вы уверены, что хотите удалить эту цель?")) return;

    const goalCard = e.target.closest(".goal-card");
    const goalId = goalCard.dataset.id;

    try {
      await deleteGoal(goalId);
      goalCard.remove();
      fetchStats();
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Не удалось удалить цель. Пожалуйста, попробуйте позже.");
    }
  }

  function getPriorityLabel(priority) {
    const labels = {
      LOW: "Низкий",
      MEDIUM: "Средний",
      HIGH: "Высокий",
    };
    return labels[priority] || priority;
  }

  function getTypeLabel(type) {
    const labels = {
      SAVING: "Накопления",
      DEBT: "Долг",
      PURCHASE: "Покупка",
      OTHER: "Другое",
    };
    return labels[type] || type;
  }

  function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, " ");
  }

  window.addEventListener("click", (e) => {
    if (e.target === goalModal) {
      closeModal();
    }
  });
});
