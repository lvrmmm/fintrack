document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://localhost:8080/api"; // адаптируй, если порт другой

  // DOM
  const saveBtn = document.getElementById("save-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const changePasswordBtn = document.getElementById("change-password-btn");
  const changeEmailBtn = document.getElementById("change-email-btn");
  const passwordModal = document.getElementById("password-modal");
  const emailModal = document.getElementById("email-modal");
  const closeButtons = document.querySelectorAll(".close");
  const confirmPasswordBtn = document.getElementById("confirm-password-btn");
  const confirmEmailBtn = document.getElementById("confirm-email-btn");

  async function safeFetch(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Ошибка запроса");
      }
      return response;
    } catch (error) {
      throw new Error("Ошибка сети. Повторите попытку.");
    }
  }

  async function loadProfile() {
    try {
      const response = await safeFetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const user = await response.json();

      document.getElementById("first-name").value = user.firstName || "";
      document.getElementById("last-name").value = user.lastName || "";
      document.getElementById("birthdate").value = user.birthDate || "";
      document.getElementById("gender").value = user.gender || "";
      document.getElementById("bio").value = user.bio || "";
      document.getElementById("current-email").value = user.email || "";
    } catch (e) {
      alert("Не удалось загрузить профиль");
    }
  }

  async function saveProfile() {
    const data = {
      firstName: document.getElementById("first-name").value,
      lastName: document.getElementById("last-name").value,
      birthDate: document.getElementById("birthdate").value,
      gender: document.getElementById("gender").value,
      bio: document.getElementById("bio").value,
    };

    try {
      await safeFetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      alert("Профиль обновлен");
    } catch (e) {
      alert(e.message);
    }
  }

  async function changePassword() {
    const current = document.getElementById("current-password").value;
    const newPass = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;

    if (!current || !newPass || !confirm) return alert("Заполните все поля");
    if (newPass !== confirm) return alert("Пароли не совпадают");

    try {
      await safeFetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
        }),
      });
      alert("Пароль изменен");
      passwordModal.style.display = "none";
    } catch (e) {
      alert(e.message);
    }
  }

  async function changeEmail() {
    const newEmail = document.getElementById("new-email").value;
    const password = document.getElementById("email-password").value;

    if (!newEmail || !password) return alert("Заполните все поля");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
      return alert("Некорректный email");

    try {
      await safeFetch(`${API_URL}/auth/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ newEmail, password }),
      });
      alert("Email обновлен. Войдите заново.");
      await logout();
    } catch (e) {
      alert(e.message);
    }
  }

  async function logout() {
    try {
      await safeFetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/frontend/sign-in.html";
    }
  }

  // Обработчики
  saveBtn.addEventListener("click", saveProfile);
  logoutBtn.addEventListener("click", logout);
  changePasswordBtn.addEventListener(
    "click",
    () => (passwordModal.style.display = "block")
  );
  changeEmailBtn.addEventListener(
    "click",
    () => (emailModal.style.display = "block")
  );
  confirmPasswordBtn.addEventListener("click", changePassword);
  confirmEmailBtn.addEventListener("click", changeEmail);

  closeButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      passwordModal.style.display = "none";
      emailModal.style.display = "none";
    })
  );

  window.addEventListener("click", (e) => {
    if (e.target === passwordModal) passwordModal.style.display = "none";
    if (e.target === emailModal) emailModal.style.display = "none";
  });

  // Запуск
  if (localStorage.getItem("token")) {
    loadProfile();
  } else {
    window.location.href = "/frontend/sign-in.html";
  }
});
