document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/frontend/sign-in.html";
    return;
  }

  const greetingText = document.getElementById("greeting-text");

  try {
    const res = await fetch("http://localhost:8080/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`Ошибка: ${res.status} ${res.statusText}`);

    const profile = await res.json();

    // Определяем время суток
    const hours = new Date().getHours();
    let greeting = "Здравствуйте";

    if (hours >= 5 && hours < 12) {
      greeting = "Доброе утро";
    } else if (hours >= 12 && hours < 18) {
      greeting = "Добрый день";
    } else if (hours >= 18 && hours < 23) {
      greeting = "Добрый вечер";
    } else {
      greeting = "Доброй ночи";
    }

    const name = profile.firstName || profile.username;

    greetingText.textContent = `${greeting}, ${name}!`;
  } catch (err) {
    console.error("Ошибка загрузки приветствия:", err);
    greetingText.textContent = "Привет!";
  }
});
