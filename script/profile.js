document.addEventListener("DOMContentLoaded", function () {
  // Элементы DOM
  const avatarUpload = document.getElementById("avatar-upload");
  const avatarPreview = document.getElementById("avatar-preview");
  const saveBtn = document.getElementById("save-btn");
  const changePasswordBtn = document.getElementById("change-password-btn");
  const changeEmailBtn = document.getElementById("change-email-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const passwordModal = document.getElementById("password-modal");
  const emailModal = document.getElementById("email-modal");
  const closeButtons = document.querySelectorAll(".close");
  const confirmPasswordBtn = document.getElementById("confirm-password-btn");
  const confirmEmailBtn = document.getElementById("confirm-email-btn");

  // Загрузка аватарки, необходимо прописать бэк на сохранение фото на сервере
  avatarUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        avatarPreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Сохранение данных профиля
  saveBtn.addEventListener("click", function () {
    // Здесь будет логика сохранения данных
    alert("Изменения сохранены успешно!");
  });

  // Открытие модального окна смены пароля
  changePasswordBtn.addEventListener("click", function () {
    passwordModal.style.display = "block";
  });

  // Открытие модального окна смены email
  changeEmailBtn.addEventListener("click", function () {
    emailModal.style.display = "block";
  });

  // Выход из профиля
  logoutBtn.addEventListener("click", function () {
    if (confirm("Вы уверены, что хотите выйти из профиля?")) {
      // Здесь будет логика выхода
      window.location.href = "./sign-in.html";
    }
  });

  // Закрытие модальных окон
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      passwordModal.style.display = "none";
      emailModal.style.display = "none";
    });
  });

  // Закрытие при клике вне модального окна
  window.addEventListener("click", function (e) {
    if (e.target === passwordModal) {
      passwordModal.style.display = "none";
    }
    if (e.target === emailModal) {
      emailModal.style.display = "none";
    }
  });

  // Смена пароля
  confirmPasswordBtn.addEventListener("click", function () {
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Заполните все поля!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Пароли не совпадают!");
      return;
    }

    // Здесь будет логика смены пароля
    alert("Пароль успешно изменен!");
    passwordModal.style.display = "none";
  });

  // Смена email
  confirmEmailBtn.addEventListener("click", function () {
    const newEmail = document.getElementById("new-email").value;
    const password = document.getElementById("email-password").value;

    if (!newEmail || !password) {
      alert("Заполните все поля!");
      return;
    }

    if (!validateEmail(newEmail)) {
      alert("Введите корректный email!");
      return;
    }

    // Здесь будет логика смены email
    alert("Email успешно изменен!");
    emailModal.style.display = "none";
  });

  // Валидация email
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
});
