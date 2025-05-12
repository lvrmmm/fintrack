const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("passwordInput");

togglePassword.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.classList.toggle("bx-show");
  togglePassword.classList.toggle("bx-hide");
});

const form = document.querySelector(".auth-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputs = form.querySelectorAll(".auth-form__input");
  const username = inputs[0].value;
  const password = inputs[1].value;

  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Неверный логин или пароль");
    }

    const data = await response.json();
    localStorage.setItem("token", data.token); // сохраняем токен
    window.location.href = "/frontend/dashboard.html"; // переход
  } catch (error) {
    alert(error.message);
  }
});
