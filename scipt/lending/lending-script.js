// Бургер меню
const burgerMenu = document.getElementById("burgerMenu");
const navList = document.getElementById("navList");

burgerMenu.addEventListener("click", () => {
  navList.classList.toggle("active");
});
