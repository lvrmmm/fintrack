// Общие скрипты для всех страниц
document.addEventListener("DOMContentLoaded", function () {
  // Установка текущей даты в приветствии
  const hour = new Date().getHours();
  const greetingText = document.getElementById("greeting-text");

  if (hour < 12) {
    greetingText.textContent = "Доброе утро, Мария!";
  } else if (hour < 18) {
    greetingText.textContent = "Добрый день, Мария!";
  } else {
    greetingText.textContent = "Добрый вечер, Мария!";
  }

  // Обработка уведомлений
  const notifications = document.querySelector(".notifications");
  if (notifications) {
    notifications.addEventListener("click", function () {
      const dropdown = this.querySelector(".notifications-dropdown");
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });
  }
});
