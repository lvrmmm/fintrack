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
  const closeEventDetailsBtn = document.getElementById("close-event-details");

  // Текущая дата
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let currentEditingId = null;

  // Заглушка данных (временные данные)
  let events = JSON.parse(localStorage.getItem("calendarEvents")) || [
    {
      id: 1,
      title: "Зарплата",
      type: "income",
      amount: 75000,
      date: new Date(currentYear, currentMonth, 5).toISOString(),
      category: "salary",
      notes: "Основная зарплата",
    },
    {
      id: 2,
      title: "Оплата аренды",
      type: "expense",
      amount: 25000,
      date: new Date(currentYear, currentMonth, 10).toISOString(),
      category: "other",
      notes: "Аренда квартиры",
    },
    {
      id: 3,
      title: "Покупка продуктов",
      type: "expense",
      amount: 5000,
      date: new Date(currentYear, currentMonth, 15).toISOString(),
      category: "food",
      notes: "На неделю",
    },
  ];

  // Инициализация
  renderCalendar();
  renderUpcomingEvents();

  // Обработчики событий
  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  addEventBtn.addEventListener("click", () => openModal("Добавить событие"));

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  eventForm.addEventListener("submit", handleFormSubmit);

  closeEventDetailsBtn.addEventListener("click", () => {
    eventDetailsContainer.classList.remove("active");
  });

  // Делегирование событий для карточек событий
  calendarGrid.addEventListener("click", function (e) {
    const eventElement = e.target.closest(".calendar-event");
    if (eventElement) {
      const eventId = parseInt(eventElement.dataset.id);
      const event = events.find((e) => e.id === eventId);
      if (event) openEventDetails(event);
    }
  });

  eventsList.addEventListener("click", function (e) {
    const eventElement = e.target.closest(".event-item");
    if (eventElement) {
      const eventId = parseInt(eventElement.dataset.id);
      const event = events.find((e) => e.id === eventId);
      if (event) openEventDetails(event);
    }
  });

  // Функция рендеринга календаря
  function renderCalendar() {
    // Установка текущего месяца в заголовке
    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Очистка календаря
    calendarGrid.innerHTML = "";

    // Добавление заголовков дней недели
    const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    dayNames.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "calendar-day-header";
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });

    // Получение первого дня месяца и количества дней в месяце
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    // Добавление пустых ячеек для дней предыдущего месяца
    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Корректировка для Пн-Вс
    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day empty";
      calendarGrid.appendChild(emptyDay);
    }

    // Добавление дней месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

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
          eventElement.className = `calendar-event ${event.type}`;
          eventElement.textContent = event.title;
          eventElement.dataset.id = event.id;
          eventElement.title = `${event.title} (${
            event.amount ? formatCurrency(event.amount) : "Напоминание"
          })`;
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

      calendarGrid.appendChild(dayElement);
    }
  }

  // Функция рендеринга предстоящих событий
  function renderUpcomingEvents() {
    eventsList.innerHTML = "";

    // Фильтрация событий (только будущие + текущий день)
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingEvents = events
      .filter((event) => new Date(event.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    if (upcomingEvents.length === 0) {
      eventsList.innerHTML = `
          <div class="empty-events">
            <i class="bx bx-calendar-event"></i>
            <p>Нет предстоящих событий</p>
          </div>
        `;
      return;
    }

    upcomingEvents.forEach((event) => {
      const eventElement = document.createElement("div");
      eventElement.className = `event-item ${event.type}`;
      eventElement.dataset.id = event.id;

      const eventDate = new Date(event.date);
      const dateStr = eventDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      });

      eventElement.innerHTML = `
          <span class="event-date"><i class="bx bx-calendar"></i> ${dateStr}</span>
          <span class="event-title">${event.title}</span>
          ${
            event.amount
              ? `<span class="event-amount">${formatCurrency(
                  event.amount
                )}</span>`
              : ""
          }
        `;

      eventsList.appendChild(eventElement);
    });
  }

  // Открытие деталей события
  function openEventDetails(event) {
    const eventDate = new Date(event.date);
    const dateStr = eventDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const typeLabels = {
      income: "Доход",
      expense: "Расход",
      reminder: "Напоминание",
    };

    const categoryLabels = {
      food: "Продукты",
      transport: "Транспорт",
      shopping: "Покупки",
      salary: "Зарплата",
      other: "Другое",
    };

    // Формируем HTML для деталей события
    eventDetailsContent.innerHTML = `
        <div class="event-detail">
          <span class="event-detail-label">Название:</span>
          <span class="event-detail-value">${event.title}</span>
        </div>
        <div class="event-detail">
          <span class="event-detail-label">Тип:</span>
          <span class="event-detail-value">${typeLabels[event.type]}</span>
        </div>
        ${
          event.amount
            ? `
        <div class="event-detail">
          <span class="event-detail-label">Сумма:</span>
          <span class="event-detail-value amount ${
            event.type
          }">${formatCurrency(event.amount)}</span>
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
            categoryLabels[event.category] || event.category
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
          <button class="btn-primary edit-event" data-id="${event.id}">
            <i class="bx bx-edit"></i> Редактировать
          </button>
          <button class="btn-secondary delete-event" data-id="${event.id}">
            <i class="bx bx-trash"></i> Удалить
          </button>
        </div>
      `;

    // Показываем блок деталей
    eventDetailsContainer.classList.add("active");

    // Добавляем обработчики для кнопок в деталях
    document
      .querySelector(".edit-event")
      ?.addEventListener("click", () => editEvent(event.id));
    document
      .querySelector(".delete-event")
      ?.addEventListener("click", () => deleteEvent(event.id));
  }

  function openModal(title, event = null) {
    document.getElementById("modal-title").textContent = title;
    currentEditingId = event ? event.id : null;

    // Сброс и заполнение формы
    eventForm.reset();

    if (event) {
      document.getElementById("event-title").value = event.title;
      document.getElementById("event-type").value = event.type;
      document.getElementById("event-amount").value = event.amount || "";
      document.getElementById("event-date").value = event.date.split("T")[0];
      document.getElementById("event-category").value =
        event.category || "other";
      document.getElementById("event-notes").value = event.notes || "";
    } else {
      // Установка дефолтной даты (сегодня)
      document.getElementById("event-date").valueAsDate = new Date();
    }

    // Показ модального окна
    eventModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    eventModal.classList.remove("active");
    document.body.style.overflow = "auto";
    currentEditingId = null;
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(eventForm);
    const eventData = {
      id: currentEditingId || Date.now(),
      title: formData.get("title"),
      type: formData.get("type"),
      amount: formData.get("amount")
        ? parseFloat(formData.get("amount"))
        : null,
      date: formData.get("date"),
      category: formData.get("category"),
      notes: formData.get("notes"),
    };

    // Валидация
    if (!eventData.title || !eventData.date) {
      showNotification("Пожалуйста, заполните обязательные поля", "error");
      return;
    }

    if (currentEditingId) {
      // Редактирование существующего события
      const index = events.findIndex((e) => e.id === currentEditingId);
      if (index !== -1) {
        events[index] = eventData;
        showNotification("Событие успешно обновлено", "success");
      }
    } else {
      // Добавление нового события
      events.push(eventData);
      showNotification("Событие успешно добавлено", "success");
    }

    saveEvents();
    renderCalendar();
    renderUpcomingEvents();
    closeModal();
  }

  function editEvent(eventId) {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      openModal("Редактировать событие", event);
      eventDetailsContainer.classList.remove("active");
    }
  }

  function deleteEvent(eventId) {
    if (confirm("Вы уверены, что хотите удалить это событие?")) {
      events = events.filter((e) => e.id !== eventId);
      saveEvents();
      renderCalendar();
      renderUpcomingEvents();
      eventDetailsContainer.classList.remove("active");
      showNotification("Событие удалено", "info");
    }
  }

  function getEventsForDay(date) {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date.includes(dateStr));
  }

  function saveEvents() {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }

  function showNotification(message, type = "info") {
    // Здесь можно реализовать красивые уведомления в UI
    console.log(`[${type}] ${message}`);
    alert(message); // Временное решение
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
});
