document.addEventListener("DOMContentLoaded", function () {
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

  // Заглушка данных (временные данные)
  let goals = JSON.parse(localStorage.getItem("goals")) || [
    {
      id: 1,
      title: "Новый телефон",
      type: "saving",
      target: 50000,
      current: 37500,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString()
        .split("T")[0],
      priority: "high",
      completed: false,
      createdAt: new Date().toISOString(),
      notes: "Модель iPhone 14 Pro",
    },
    {
      id: 2,
      title: "Погашение кредита",
      type: "debt",
      target: 120000,
      current: 80000,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .split("T")[0],
      priority: "medium",
      completed: false,
      createdAt: new Date().toISOString(),
      notes: "Кредит в Сбербанке",
    },
    {
      id: 3,
      title: "Отпуск на море",
      type: "saving",
      target: 100000,
      current: 25000,
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 6))
        .toISOString()
        .split("T")[0],
      priority: "medium",
      completed: false,
      createdAt: new Date().toISOString(),
      notes: "Турция, отель 5 звезд",
    },
  ];

  // Инициализация
  renderGoals();
  updateStats();

  // Обработчики событий
  addGoalBtn.addEventListener("click", () => openModal("Добавить цель"));

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  goalForm.addEventListener("submit", handleFormSubmit);

  // Делегирование событий для кнопок в карточках целей
  goalsList.addEventListener("click", function (e) {
    const target = e.target;
    const editBtn = target.closest(".edit-goal");
    const deleteBtn = target.closest(".delete-goal");
    const completeBtn = target.closest(".complete-goal");

    if (editBtn) {
      const goalId = parseInt(editBtn.dataset.id);
      editGoal(goalId);
    } else if (deleteBtn) {
      const goalId = parseInt(deleteBtn.dataset.id);
      deleteGoal(goalId);
    } else if (completeBtn) {
      const goalId = parseInt(completeBtn.dataset.id);
      toggleCompleteGoal(goalId);
    }
  });

  // Функция рендеринга целей
  function renderGoals() {
    goalsList.innerHTML = "";

    if (goals.length === 0) {
      goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="bx bx-target-lock"></i>
                    <p>У вас пока нет финансовых целей</p>
                    <button id="add-first-goal" class="btn-primary" style="margin-top: 16px;">
                        <i class="bx bx-plus"></i> Создать первую цель
                    </button>
                </div>
            `;
      document
        .getElementById("add-first-goal")
        ?.addEventListener("click", () => openModal("Добавить цель"));
      return;
    }

    // Сортируем цели: сначала незавершенные, затем завершенные
    goals.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    goals.forEach((goal) => {
      const progress = (goal.current / goal.target) * 100;
      const isOverdue = new Date(goal.deadline) < new Date() && !goal.completed;

      const goalCard = document.createElement("div");
      goalCard.className = `goal-card ${goal.completed ? "completed" : ""} ${
        isOverdue ? "overdue" : ""
      }`;
      goalCard.innerHTML = `
                <div class="goal-card-header">
                    <div>
                        <h3 class="goal-title">${goal.title}</h3>
                        <span class="goal-type">${getTypeLabel(
                          goal.type
                        )}</span>
                    </div>
                    ${
                      goal.completed
                        ? '<span class="goal-badge" style="background: #2ecc71; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Завершено</span>'
                        : isOverdue
                        ? '<span class="goal-badge" style="background:#e74c3c; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Просрочено</span>'
                        : ""
                    }
                </div>
                <div class="goal-progress">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill ${
                              goal.completed ? "completed" : ""
                            }" 
                                 style="width: ${Math.min(
                                   progress,
                                   100
                                 )}%"></div>
                        </div>
                        <span class="progress-text">${Math.round(
                          progress
                        )}%</span>
                    </div>
                    <div class="progress-info">
                        <span>Накоплено: ${formatCurrency(goal.current)}</span>
                        <span>Цель: ${formatCurrency(goal.target)}</span>
                    </div>
                </div>
                <div class="goal-details">
                    <div class="goal-detail">
                        <i class="bx bx-calendar"></i>
                        <span>Срок: ${formatDate(goal.deadline)}</span>
                    </div>
                    <div class="goal-detail">
                        <i class="bx bx-star"></i>
                        <span>Приоритет: ${getPriorityLabel(
                          goal.priority
                        )}</span>
                    </div>
                    ${
                      goal.notes
                        ? `
                    <div class="goal-detail full-width">
                        <i class="bx bx-note"></i>
                        <span>${goal.notes}</span>
                    </div>`
                        : ""
                    }
                </div>
                <div class="goal-actions">
                    <button class="goal-btn ${
                      goal.completed ? "btn-secondary" : "btn-complete"
                    } complete-goal" data-id="${goal.id}">
                        <i class="bx ${
                          goal.completed ? "bx-reset" : "bx-check"
                        }"></i>
                        ${goal.completed ? "Возобновить" : "Завершить"}
                    </button>
                    <button class="goal-btn btn-edit edit-goal" data-id="${
                      goal.id
                    }">
                        <i class="bx bx-edit"></i> Изменить
                    </button>
                    <button class="goal-btn btn-delete delete-goal" data-id="${
                      goal.id
                    }">
                        <i class="bx bx-trash"></i> Удалить
                    </button>
                </div>
            `;
      goalsList.appendChild(goalCard);
    });
  }

  function openModal(title, goal = null) {
    modalTitle.textContent = title;
    currentEditingId = goal ? goal.id : null;

    // Сброс и заполнение формы
    goalForm.reset();

    if (goal) {
      document.getElementById("goal-title").value = goal.title;
      document.getElementById("goal-type").value = goal.type;
      document.getElementById("goal-target").value = goal.target;
      document.getElementById("goal-current").value = goal.current || 0;
      document.getElementById("goal-deadline").value = goal.deadline;
      document.getElementById("goal-priority").value =
        goal.priority || "medium";
      document.getElementById("goal-notes").value = goal.notes || "";
    } else {
      // Установка дефолтной даты (месяц от текущей)
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      document.getElementById("goal-deadline").valueAsDate = defaultDate;
    }

    // Показ модального окна с анимацией
    goalModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    goalModal.classList.remove("active");
    document.body.style.overflow = "auto";
    currentEditingId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(goalForm);
    const goalData = {
      id: currentEditingId || Date.now(),
      title: formData.get("title"),
      type: formData.get("type"),
      target: parseFloat(formData.get("target")),
      current: parseFloat(formData.get("current")) || 0,
      deadline: formData.get("deadline"),
      priority: formData.get("priority"),
      notes: formData.get("notes"),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Валидация
    if (!goalData.title || !goalData.target || !goalData.deadline) {
      alert("Пожалуйста, заполните обязательные поля");
      return;
    }

    if (goalData.current > goalData.target) {
      alert("Текущая сумма не может превышать целевую");
      return;
    }

    if (currentEditingId) {
      // Редактирование существующей цели
      const index = goals.findIndex((g) => g.id === currentEditingId);
      if (index !== -1) {
        goalData.completed = goals[index].completed;
        goalData.createdAt = goals[index].createdAt;
        goals[index] = goalData;
        showNotification("Цель успешно обновлена", "success");
      }
    } else {
      // Добавление новой цели
      goals.push(goalData);
      showNotification("Цель успешно добавлена", "success");
    }

    saveGoals();
    renderGoals();
    updateStats();
    checkCompletedGoals();
    closeModal();
  }

  function editGoal(id) {
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      openModal("Редактировать цель", goal);
    }
  }

  function deleteGoal(id) {
    if (confirm("Вы уверены, что хотите удалить эту цель?")) {
      goals = goals.filter((g) => g.id !== id);
      saveGoals();
      renderGoals();
      updateStats();
      showNotification("Цель удалена", "info");
    }
  }

  function toggleCompleteGoal(id) {
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      goal.completed = !goal.completed;
      saveGoals();
      renderGoals();
      updateStats();

      if (goal.completed) {
        showNotification(`Цель "${goal.title}" завершена!`, "success");
      } else {
        showNotification(`Цель "${goal.title}" возобновлена`, "info");
      }
    }
  }

  function checkCompletedGoals() {
    goals.forEach((goal) => {
      if (!goal.completed && goal.current >= goal.target) {
        goal.completed = true;
        showNotification(
          `Поздравляем! Вы достигли цели "${goal.title}"`,
          "success"
        );
      }
    });
    saveGoals();
  }

  function updateStats() {
    const completed = goals.filter((g) => g.completed).length;
    const active = goals.filter((g) => !g.completed).length;
    const overdue = goals.filter(
      (g) => !g.completed && new Date(g.deadline) < new Date()
    ).length;

    completedGoalsEl.textContent = completed;
    activeGoalsEl.textContent = active;
    overdueGoalsEl.textContent = overdue;
  }

  function saveGoals() {
    localStorage.setItem("goals", JSON.stringify(goals));
  }

  function showNotification(message, type = "info") {
    // Здесь можно реализовать красивые уведомления в UI
    console.log(`[${type}] ${message}`);

    // Временное решение - alert для демонстрации
    if (type === "success") {
      alert("✓ " + message);
    } else {
      alert(message);
    }
  }

  // Вспомогательные функции
  function formatCurrency(amount) {
    return amount
      .toLocaleString("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 0,
      })
      .replace("RUB", "₽");
  }

  function formatDate(dateString) {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("ru-RU", options);
  }

  function getTypeLabel(type) {
    const types = {
      saving: "Накопления",
      debt: "Погашение долга",
      purchase: "Крупная покупка",
      other: "Другое",
    };
    return types[type] || type;
  }

  function getPriorityLabel(priority) {
    const priorities = {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
    };
    return priorities[priority] || priority;
  }
});
