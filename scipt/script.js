document.addEventListener("DOMContentLoaded", function () {
  const steps = document.querySelectorAll(".step");
  let currentActiveIndex = 0;

  activateStep(steps[0]);

  function activateStep(step) {
    steps.forEach((s) => {
      s.classList.remove("active");
      s.querySelector(".step-progress").style.width = "0";
    });

    step.classList.add("active");
    step.querySelector(".step-progress").style.width = "100%";
    step.querySelector(".step-progress").style.animation =
      "fillStep 1.5s ease-out";
  }

  function checkStepsOnScroll() {
    const scrollPosition = window.scrollY + window.innerHeight / 2;

    let newActiveIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepTop = step.offsetTop;

      if (scrollPosition > stepTop) {
        newActiveIndex = i;
      } else {
        break;
      }
    }
    if (newActiveIndex !== currentActiveIndex) {
      currentActiveIndex = newActiveIndex;
      activateStep(steps[currentActiveIndex]);
    }
  }

  let isScrolling;
  window.addEventListener(
    "scroll",
    function () {
      window.clearTimeout(isScrolling);
      isScrolling = setTimeout(checkStepsOnScroll, 100);
    },
    false
  );
});
