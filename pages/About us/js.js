const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menuToggle = document.querySelector("#menu-toggle");
const mainNavigation = document.querySelector("#main-navigation");
const themeToggle = document.querySelector("#theme-toggle");

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  mainNavigation.classList.toggle("max-[680px]:hidden", !isOpen);
  mainNavigation.classList.toggle("max-[680px]:flex", isOpen);
});

mainNavigation.addEventListener("click", (event) => {
  if (event.target.closest("a") && window.matchMedia("(max-width: 680px)").matches) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    mainNavigation.classList.add("max-[680px]:hidden");
    mainNavigation.classList.remove("max-[680px]:flex");
  }
});

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("theme-dark");
  themeToggle.textContent = isDark ? "☀" : "☾";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", isDark ? "Включить светлую тему" : "Включить тёмную тему");
});

const careVideo = document.querySelector("#care-video");
const careVideoPlay = document.querySelector("#care-video-play");
const careVideoError = document.querySelector("#care-video-error");

careVideoPlay.addEventListener("click", () => {
  careVideoError.hidden = true;
  careVideo.play().catch((error) => {
    console.error("Could not start the care video:", error);
    careVideoError.hidden = false;
  });
});

careVideo.addEventListener("play", () => {
  careVideoError.hidden = true;
  careVideoPlay.hidden = true;
  careVideoPlay.setAttribute("aria-label", "Video playing");
});

careVideo.addEventListener("pause", () => {
  careVideoPlay.hidden = false;
  careVideoPlay.setAttribute("aria-label", "Resume video");
});

careVideo.addEventListener("ended", () => {
  careVideoPlay.hidden = false;
  careVideoPlay.setAttribute("aria-label", "Play video again");
});

careVideo.addEventListener("error", () => {
  console.error("Could not load the care video:", careVideo.error);
  careVideoError.hidden = false;
});

const specialistsTrack = document.querySelector("#specialists-track");
const specialistDots = document.querySelectorAll(".specialist-dot");
let specialistIndex = 0;
let specialistMoving = false;

function updateSpecialistDots() {
  const activePage = Math.round(specialistIndex / 2);
  specialistDots.forEach((dot, index) => {
    const isActive = index === activePage;
    dot.setAttribute("aria-current", String(isActive));
    dot.classList.toggle("bg-[#55b8ac]", isActive);
    dot.classList.toggle("bg-[#cdebe6]", !isActive);
    dot.classList.toggle("w-5", isActive);
  });
}

function specialistStep() {
  const card = specialistsTrack.firstElementChild;
  const gap = parseFloat(window.getComputedStyle(specialistsTrack).columnGap);
  return card.getBoundingClientRect().width + gap;
}

function waitForSpecialistTransition() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, reducedMotion.matches ? 0 : 520);
  });
}

async function moveSpecialists(direction) {
  if (specialistMoving || !specialistsTrack.children.length) {
    return;
  }

  specialistMoving = true;
  const step = specialistStep();
  const transition = reducedMotion.matches ? "none" : "transform 500ms ease";

  if (direction > 0) {
    specialistsTrack.style.transition = transition;
    specialistsTrack.style.transform = `translateX(-${step}px)`;
    await waitForSpecialistTransition();
    specialistsTrack.append(specialistsTrack.firstElementChild);
    specialistIndex = (specialistIndex + 1) % specialistsTrack.children.length;
  } else {
    specialistsTrack.style.transition = "none";
    specialistsTrack.prepend(specialistsTrack.lastElementChild);
    specialistsTrack.style.transform = `translateX(-${step}px)`;
    specialistsTrack.offsetWidth;
    specialistsTrack.style.transition = transition;
    requestAnimationFrame(() => {
      specialistsTrack.style.transform = "translateX(0)";
    });
    await waitForSpecialistTransition();
    specialistIndex =
      (specialistIndex - 1 + specialistsTrack.children.length) %
      specialistsTrack.children.length;
  }

  specialistsTrack.style.transition = "none";
  specialistsTrack.style.transform = "translateX(0)";
  specialistsTrack.offsetWidth;
  specialistsTrack.style.transition = "";
  updateSpecialistDots();
  specialistMoving = false;
}

document.querySelector(".specialist-next").addEventListener("click", () => {
  moveSpecialists(1);
});
document.querySelector(".specialist-prev").addEventListener("click", () => {
  moveSpecialists(-1);
});

specialistDots.forEach((dot) => {
  dot.addEventListener("click", async () => {
    const target = Number(dot.dataset.page);
    const count = specialistsTrack.children.length;
    const forward = (target - specialistIndex + count) % count;
    const backward = (specialistIndex - target + count) % count;
    const direction = forward <= backward ? 1 : -1;
    const steps = Math.min(forward, backward);

    for (let step = 0; step < steps; step += 1) {
      await moveSpecialists(direction);
    }
  });
});
