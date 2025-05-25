document.addEventListener("DOMContentLoaded", function () {
  // Элементы DOM
  const calendarGrid = document.getElementById("calendar-grid");
  const eventsList = document.getElementById("events-list");
  const currentMonthEl = document.getElementById("current-month");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const addEventBtn = document.getElementById("add-event");
  const eventModal = document.getElementById("event-modal");
  const eventForm = document.getElementById("event-form");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  const eventDetailsContainer = document.getElementById("event-details");
  const eventDetailsContent = document.querySelector(".event-details-content");

  const apiBaseUrl = "http://localhost:8080";

  // Текущая дата и аутентификация
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  const authToken = localStorage.getItem("token");
  let allEvents = []; 

  if (!authToken) {
    window.location.href = "/frontend/sign-in.html";
    return;
  }

  renderCalendar();
  loadEvents();

  // Обработчики событий
  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
    loadEvents();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
    loadEvents();
  });

  addEventBtn.addEventListener("click", openEventModal);
  closeModalBtns.forEach((btn) => btn.addEventListener("click", closeModal));
  eventForm.addEventListener("submit", handleFormSubmit);

  // Функция загрузки событий с сервера
  async function loadEvents() {
    try {
      const startDate = new Date(currentYear, currentMonth, 1); 
      const endDate = new Date(currentYear, currentMonth + 1, 0); 

      const response = await fetchWithAuth(
        `${apiBaseUrl}/api/calendar?startDate=${formatDate(
          startDate
        )}&endDate=${formatDate(endDate)}`
      );

      if (!response.ok) throw new Error("Ошибка загрузки событий");

      allEvents = await response.json();
      renderCalendar();
      renderUpcomingEvents();
      console.log(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      showNotification("Ошибка загрузки событий", "error");
    }
  }

  // Рендеринг календаря
  function renderCalendar() {
    // Установка текущего месяца в заголовке
    currentMonthEl.textContent = new Date(
      currentYear,
      currentMonth
    ).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

    calendarGrid.innerHTML = "";
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "calendar-day-header";
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });

    // Заполнение дней календаря
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    // Пустые ячейки для дней предыдущего месяца
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startDay; i++) {
      calendarGrid.appendChild(createEmptyDay());
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      const dayElement = createDayElement(day, isToday, isWeekend, date);
      calendarGrid.appendChild(dayElement);
    }
  }

  function createEmptyDay() {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day empty";
    return emptyDay;
  }

  function createDayElement(day, isToday, isWeekend, date) {
    const dayElement = document.createElement("div");
    dayElement.className = `calendar-day ${isToday ? "today" : ""} ${
      isWeekend ? "weekend" : ""
    }`;

    // Номер дня
    const dayNumber = document.createElement("div");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    // События для этого дня
    const dayEvents = getEventsForDay(date);
    if (dayEvents.length > 0) {
      const eventsContainer = document.createElement("div");
      eventsContainer.className = "calendar-events";

      dayEvents.slice(0, 3).forEach((event) => {
        const eventElement = document.createElement("div");
        eventElement.className = `calendar-event ${getEventTypeClass(
          event.type
        )}`;
        eventElement.style.backgroundColor = event.color || "#3498db";
        
        eventElement.textContent = event.title ?? "Финансовое событие";
        
        eventElement.dataset.id = event.id;
        
        eventElement.title = `${event.title ?? "Финансовое событие"} (${formatDate(
          new Date(event.date)
        )})`;
        
        eventElement.addEventListener("click", () => showEventDetails(event));
        eventsContainer.appendChild(eventElement);
      });

      if (dayEvents.length > 3) {
        const moreEvents = document.createElement("div");
        moreEvents.className = "calendar-event";
        moreEvents.textContent = `+${dayEvents.length - 3} еще`;
        eventsContainer.appendChild(moreEvents);
      }

      dayElement.appendChild(eventsContainer);
    }

    return dayElement;
}

  // Рендеринг списка предстоящих событий
  function renderUpcomingEvents() {
    eventsList.innerHTML = "";

    if (!allEvents || allEvents.length === 0) {
      eventsList.innerHTML = `
      <div class="empty-events">
        <i class="bx bx-calendar-event"></i>
        <p>Нет предстоящих событий</p>
        <p class="empty-hint">Добавьте транзакции или финансовые цели, чтобы они отображались здесь</p>
      </div>
    `;
      return;
    }

    // Фильтрация и сортировка событий
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingEvents = allEvents
      .filter((event) => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    if (upcomingEvents.length === 0) {
      eventsList.innerHTML = `
                <div class="empty-events">
                    <i class="bx bx-calendar-event"></i>
                    <p>Нет предстоящих событий</p>
                    <p class="empty-hint">Все ваши события уже прошли</p>
                </div>
            `;
      return;
    }

    upcomingEvents.forEach((event) => {
      const eventElement = createEventElement(event);
      eventsList.appendChild(eventElement);
    });
}


  function createEventElement(event) {
    const eventElement = document.createElement("div");
    eventElement.className = `event-item ${getEventTypeClass(event.type)}`;
    eventElement.dataset.id = event.id;

    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });

    eventElement.innerHTML = `
    <span class="event-date"><i class="bx bx-calendar"></i> ${dateStr}</span>
    <span class="event-title">${event.title ?? "Финансовове событие (название не указано)"}</span>
    ${
      event.amount !== null && event.amount !== undefined
        ? `<span class="event-amount">${formatCurrency(event.amount)}</span>`
        : ""
    }
    `;

    eventElement.addEventListener("click", () => showEventDetails(event));
    return eventElement;
  }

  function openEventModal() {
    document.getElementById("modal-title").textContent = "Добавить событие";
    eventForm.reset();
    document.getElementById("event-date").valueAsDate = new Date();
    eventModal.classList.add("active");
  }

  function closeModal() {
    eventModal.classList.remove("active");
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(eventForm);
    const eventData = {
      title: formData.get("title"),
      type: formData.get("type"),
      amount: formData.get("amount")
        ? parseFloat(formData.get("amount"))
        : null,
      date: formData.get("date"),
      category: formData.get("category"),
      notes: formData.get("notes"),
      color: getColorForEventType(formData.get("type")),
    };

    try {
      const response = await fetchWithAuth(
        "http://localhost:8080/api/calendar/user-event",
        {
          method: "POST",
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) throw new Error("Ошибка сохранения");

      showNotification("Событие успешно сохранено", "success");
      closeModal();
      loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      showNotification("Ошибка сохранения события", "error");
    }
  }

  async function showEventDetails(event) {
    try {
      let details;

      if (event.transactionId) {
        const response = await fetchWithAuth(
          `${apiBaseUrl}/api/transactions/${event.transactionId}`
        );
        details = await response.json();
        renderTransactionDetails(details);
      } else if (event.goalId) {
        const response = await fetchWithAuth(
          `${apiBaseUrl}/api/goals/${event.goalId}`
        );
        details = await response.json();
        renderGoalDetails(details);
      } else {
        details = event;
        renderUserEventDetails(details);
      }

      eventDetailsContainer.classList.add("active");
    } catch (error) {
      console.error("Error loading event details:", error);
      showNotification("Ошибка загрузки деталей", "error");
    }
  }

  function renderTransactionDetails(transaction) {
    const dateStr = new Date(transaction.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const translateCategory = (category) => {
      if (!category) return "Не указана";
      const translations = {
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
      return translations[category] || category;
    };

    eventDetailsContent.innerHTML = `
            <div class="event-detail">
                <span class="event-detail-label">Описание:</span>
                <span class="event-detail-value">${
                transaction.description || (transaction.type === "INCOME" ? "Получение средств" : "Списание средств")
            }</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Тип:</span>
                <span class="event-detail-value">${
                  transaction.type === "INCOME" ? "Доход" : "Расход"
                }</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Сумма:</span>
                <span class="event-detail-value amount ${transaction.type.toLowerCase()}">
                    ${formatCurrency(transaction.amount)}
                </span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Дата:</span>
                <span class="event-detail-value">${dateStr}</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Категория:</span>
                <span class="event-detail-value">${
                  translateCategory(transaction.category)
                }</span>
            </div>
            ${
              transaction.notes
                ? `
            <div class="event-detail">
                <span class="event-detail-label">Заметки:</span>
                <span class="event-detail-value">${transaction.notes}</span>
            </div>
            `
                : ""
            }
            <div class="event-actions">
                <button class="btn-secondary" id="close-details">
                    <i class="bx bx-x"></i> Закрыть
                </button>
            </div>
        `;

    document.getElementById("close-details").addEventListener("click", () => {
      eventDetailsContainer.classList.remove("active");
    });
  }

  function renderGoalDetails(goal) {
    const dateStr = new Date(goal.deadline).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(
      1
    );

    eventDetailsContent.innerHTML = `
            <div class="event-detail">
                <span class="event-detail-label">Название:</span>
                <span class="event-detail-value">${goal.name}</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Срок:</span>
                <span class="event-detail-value">${dateStr}</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Прогресс:</span>
                <span class="event-detail-value">
                    ${formatCurrency(goal.currentAmount)} / ${formatCurrency(
      goal.targetAmount
    )} (${progress}%)
                </span>
            </div>
            <div class="progress-container" style="margin: 10px 0;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            ${
              goal.notes
                ? `
            <div class="event-detail">
                <span class="event-detail-label">Заметки:</span>
                <span class="event-detail-value">${goal.notes}</span>
            </div>
            `
                : ""
            }
            <div class="event-actions">
                <button class="btn-secondary" id="close-details">
                    <i class="bx bx-x"></i> Закрыть
                </button>
            </div>
        `;

    document.getElementById("close-details").addEventListener("click", () => {
      eventDetailsContainer.classList.remove("active");
    });
  }

  function renderUserEventDetails(event) {
    const dateStr = new Date(event.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const title = event.title ?? "Событие без названия";

    eventDetailsContent.innerHTML = `
            <div class="event-detail">
                <span class="event-detail-label">Название:</span>
                <span class="event-detail-value">${title}</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Тип:</span>
                <span class="event-detail-value">${getEventTypeLabel(
                  event.type
                )}</span>
            </div>
            ${
              event.amount
                ? `
            <div class="event-detail">
                <span class="event-detail-label">Сумма:</span>
                <span class="event-detail-value">${formatCurrency(
                  event.amount
                )}</span>
            </div>
            `
                : ""
            }
            <div class="event-detail">
                <span class="event-detail-label">Дата:</span>
                <span class="event-detail-value">${dateStr}</span>
            </div>
            <div class="event-detail">
                <span class="event-detail-label">Категория:</span>
                <span class="event-detail-value">${
                  event.category || "Не указана"
                }</span>
            </div>
            ${
              event.notes
                ? `
            <div class="event-detail">
                <span class="event-detail-label">Заметки:</span>
                <span class="event-detail-value">${event.notes}</span>
            </div>
            `
                : ""
            }
            <div class="event-actions">
                <button class="btn-danger" id="delete-event" data-id="${
                  event.id
                }">
                    <i class="bx bx-trash"></i> Удалить
                </button>
                <button class="btn-secondary" id="close-details">
                    <i class="bx bx-x"></i> Закрыть
                </button>
            </div>
        `;

    document
      .getElementById("delete-event")
      .addEventListener("click", async () => {
        if (confirm("Вы уверены, что хотите удалить это событие?")) {
          try {
            const response = await fetchWithAuth(
              `/api/calendar/user-event/${event.id}`,
              {
                method: "DELETE",
              }
            );

            if (response.ok) {
              showNotification("Событие удалено", "success");
              eventDetailsContainer.classList.remove("active");
              loadEvents();
            } else {
              throw new Error("Ошибка удаления");
            }
          } catch (error) {
            console.error("Error deleting event:", error);
            showNotification("Ошибка удаления события", "error");
          }
        }
      });

    document.getElementById("close-details").addEventListener("click", () => {
      eventDetailsContainer.classList.remove("active");
    });
  }

  function getEventsForDay(date) {
    const dateStr = formatDate(date);

    return allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      const eventDateStr = formatDate(eventDate);

      return eventDateStr === dateStr;
    });
  }

  function getEventTypeClass(eventType) {
    switch (eventType) {
      case "TRANSACTION_INCOME":
        return "income";
      case "TRANSACTION_EXPENSE":
        return "expense";
      case "GOAL_DEADLINE":
        return "goal";
      case "GOAL_MILESTONE":
        return "goal-milestone";
      case "REMINDER":
        return "reminder";
      default:
        return "";
    }
  }

  function getEventTypeLabel(eventType) {
    switch (eventType) {
      case "TRANSACTION_INCOME":
        return "Доход";
      case "TRANSACTION_EXPENSE":
        return "Расход";
      case "GOAL_DEADLINE":
        return "Дедлайн цели";
      case "GOAL_MILESTONE":
        return "Этап цели";
      case "REMINDER":
        return "Напоминание";
      default:
        return eventType;
    }
  }

  function getColorForEventType(eventType) {
    switch (eventType) {
      case "TRANSACTION_INCOME":
        return "#2ecc71";
      case "TRANSACTION_EXPENSE":
        return "#e74c3c";
      case "GOAL_DEADLINE":
        return "#3498db";
      case "GOAL_MILESTONE":
        return "#9b59b6";
      case "REMINDER":
        return "#f39c12";
      default:
        return "#3498db";
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
      window.location.href = "/frontend/sign-in.html";
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Ошибка запроса");
    }

    return response;
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
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

    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
});
