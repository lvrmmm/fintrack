const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.className = isPassword
    ? "bx bx-hide password-toggle-icon"
    : "bx bx-show password-toggle-icon";
});

const form = document.querySelector(".registration-form__container");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = form.querySelector('input[name="username"]').value;
  const email = form.querySelector('input[name="email"]').value;
  const password = form.querySelector('input[name="password"]').value;

  try {
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при регистрации");
    }

    alert("Регистрация прошла успешно!");
    window.location.href = "/frontend/sign-in.html";
  } catch (error) {
    alert(error.message);
  }
});
