  const menuToggle = document.querySelector("#menu-toggle");
  const mainNavigation = document.querySelector("#main-navigation");

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

  window.matchMedia("(min-width: 681px)").addEventListener("change", (event) => {
    if (event.matches) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Открыть меню");
      mainNavigation.classList.add("max-[680px]:hidden");
      mainNavigation.classList.remove("max-[680px]:flex");
    }
  });

  const themeToggle = document.querySelector("#theme-toggle");
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("theme-dark");
    themeToggle.textContent = isDark ? "☀" : "☾";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Включить светлую тему" : "Включить тёмную тему"
    );
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const packageFilterTrack = document.querySelector("#package-filter-track");
  const packageFilterGroup = packageFilterTrack.querySelector(".package-filter-group");
  const healthPlans = document.querySelectorAll(".health-plan");

  function buildPackageFilterLoop() {
    packageFilterTrack.querySelectorAll(".package-filter-group").forEach((group, index) => {
      if (index > 0) {
        group.remove();
      }
    });

    if (!reducedMotion.matches) {
      const duplicate = packageFilterGroup.cloneNode(true);
      duplicate.setAttribute("aria-hidden", "true");
      duplicate.inert = true;
      packageFilterTrack.append(duplicate);
    }
  }

  packageFilterTrack.addEventListener("click", (event) => {
    const filter = event.target.closest(".package-filter");
    if (!filter || filter.closest('[aria-hidden="true"]')) {
      return;
    }

    const category = filter.dataset.filter;
    packageFilterTrack.querySelectorAll(".package-filter").forEach((button) => {
      const isActive = button.dataset.filter === category;
      button.setAttribute("aria-pressed", String(isActive));
      button.classList.toggle("is-active", isActive);
    });

    healthPlans.forEach((plan) => {
      plan.hidden =
        category !== "all" && !plan.dataset.category.split(" ").includes(category);
    });
  });

  buildPackageFilterLoop();
  reducedMotion.addEventListener("change", buildPackageFilterLoop);

  document.querySelectorAll(".plan-add").forEach((button) => {
    button.addEventListener("click", () => {
      const isAdded = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(isAdded));
      button.textContent = isAdded ? "Added" : "Add plan";
      button.classList.toggle("bg-[#0d1729]", isAdded);
      button.classList.toggle("bg-[#55b8ac]", !isAdded);
    });
  });

  const careTeamTrack = document.querySelector("#care-team-track");
  const careTeamDots = document.querySelectorAll(".care-team-dot");
  let careTeamIndex = 0;
  let careTeamMoving = false;

  function updateCareTeamDots() {
    const activePage = Math.floor(careTeamIndex / 2);
    careTeamDots.forEach((dot, index) => {
      const isActive = index === activePage;
      dot.setAttribute("aria-current", String(isActive));
      dot.classList.toggle("bg-[#55b8ac]", isActive);
      dot.classList.toggle("bg-[#cdebe6]", !isActive);
      dot.classList.toggle("w-5", isActive);
    });
  }

  function careTeamStep() {
    const card = careTeamTrack.firstElementChild;
    const gap = parseFloat(window.getComputedStyle(careTeamTrack).columnGap);
    return card.getBoundingClientRect().width + gap;
  }

  function waitForCareTeamTransition() {
    return new Promise((resolve) => {
      window.setTimeout(resolve, reducedMotion.matches ? 0 : 520);
    });
  }

  async function moveCareTeam(direction) {
    if (careTeamMoving || !careTeamTrack.children.length) {
      return;
    }

    careTeamMoving = true;
    const step = careTeamStep();
    const duration = reducedMotion.matches ? "none" : "transform 500ms ease";

    if (direction > 0) {
      careTeamTrack.style.transition = duration;
      careTeamTrack.style.transform = `translateX(-${step}px)`;
      await waitForCareTeamTransition();
      careTeamTrack.append(careTeamTrack.firstElementChild);
      careTeamIndex = (careTeamIndex + 1) % careTeamTrack.children.length;
    } else {
      careTeamTrack.style.transition = "none";
      careTeamTrack.prepend(careTeamTrack.lastElementChild);
      careTeamTrack.style.transform = `translateX(-${step}px)`;
      careTeamTrack.offsetWidth;
      careTeamTrack.style.transition = duration;
      requestAnimationFrame(() => {
        careTeamTrack.style.transform = "translateX(0)";
      });
      await waitForCareTeamTransition();
      careTeamIndex =
        (careTeamIndex - 1 + careTeamTrack.children.length) %
        careTeamTrack.children.length;
    }

    careTeamTrack.style.transition = "none";
    careTeamTrack.style.transform = "translateX(0)";
    careTeamTrack.offsetWidth;
    careTeamTrack.style.transition = "";
    updateCareTeamDots();
    careTeamMoving = false;
  }

  document.querySelector(".care-team-next").addEventListener("click", () => {
    moveCareTeam(1);
  });
  document.querySelector(".care-team-prev").addEventListener("click", () => {
    moveCareTeam(-1);
  });

  careTeamDots.forEach((dot) => {
    dot.addEventListener("click", async () => {
      const target = Number(dot.dataset.page);
      const count = careTeamTrack.children.length;
      const forward = (target - careTeamIndex + count) % count;
      const backward = (careTeamIndex - target + count) % count;
      const direction = forward <= backward ? 1 : -1;
      const steps = Math.min(forward, backward);

      for (let step = 0; step < steps; step += 1) {
        await moveCareTeam(direction);
      }
    });
  });

  const patientStoryImage = document.querySelector("#patient-story-image");
  const patientStoryPhotos = [
    { src: "assets/фото.jpg", alt: "Doctor holding a tablet" },
    { src: "assets/фото2.jpg", alt: "Doctor standing with arms crossed" },
    { src: "assets/фото3.jpg", alt: "Doctor standing with arms crossed" },
    { src: "assets/фото5.jpg", alt: "Doctor in a white coat" }
  ];
  let patientStoryPhotoIndex = 0;

  function changePatientStoryPhoto(direction) {
    patientStoryPhotoIndex =
      (patientStoryPhotoIndex + direction + patientStoryPhotos.length) %
      patientStoryPhotos.length;
    const photo = patientStoryPhotos[patientStoryPhotoIndex];

    patientStoryImage.classList.remove("is-changing");
    patientStoryImage.src = photo.src;
    patientStoryImage.alt = photo.alt;
    void patientStoryImage.offsetWidth;
    patientStoryImage.classList.add("is-changing");
  }

  document
    .querySelector(".patient-story-prev")
    .addEventListener("click", () => changePatientStoryPhoto(-1));
  document
    .querySelector(".patient-story-next")
    .addEventListener("click", () => changePatientStoryPhoto(1));

  const billingToggle = document.querySelector("#billing-toggle");
  const pricingAmounts = document.querySelectorAll(".pricing-amount");
  const monthlyBillingLabel = document.querySelector(".billing-label-monthly");
  const yearlyBillingLabel = document.querySelector(".billing-label-yearly");

  billingToggle.addEventListener("click", () => {
    const isYearly = billingToggle.getAttribute("aria-pressed") !== "true";
    billingToggle.setAttribute("aria-pressed", String(isYearly));
    billingToggle.setAttribute(
      "aria-label",
      isYearly ? "Switch to monthly billing" : "Switch to yearly billing"
    );
    monthlyBillingLabel.classList.toggle("font-semibold", !isYearly);
    yearlyBillingLabel.classList.toggle("font-semibold", isYearly);

    pricingAmounts.forEach((amount) => {
      amount.classList.add("is-changing");
      window.setTimeout(() => {
        amount.textContent = `$${amount.dataset[isYearly ? "yearly" : "monthly"]}`;
        amount.classList.remove("is-changing");
      }, reducedMotion.matches ? 0 : 180);
    });
  });

  const healthInsightsGrid = document.querySelector("#health-insights-grid");
  const healthInsightsToggle = document.querySelector("#health-insights-toggle");
  const extraInsightCards = healthInsightsGrid.querySelectorAll(".insight-card-more");
  const insightCards = healthInsightsGrid.querySelectorAll(".insight-card");
  const insightObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12 }
        )
      : null;

  insightCards.forEach((card) => {
    if (insightObserver && !card.classList.contains("hidden")) {
      insightObserver.observe(card);
    } else if (!card.classList.contains("hidden")) {
      card.classList.add("is-visible");
    }
  });

  healthInsightsToggle.addEventListener("click", () => {
    const showMore = healthInsightsToggle.getAttribute("aria-expanded") !== "true";
    healthInsightsToggle.setAttribute("aria-expanded", String(showMore));
    healthInsightsToggle.querySelector("span").textContent = showMore
      ? "Show less"
      : "Show more";

    extraInsightCards.forEach((card) => {
      card.classList.toggle("hidden", !showMore);
      if (showMore) {
        card.classList.remove("is-visible");
        if (insightObserver) {
          insightObserver.observe(card);
        } else {
          card.classList.add("is-visible");
        }
      } else {
        card.classList.remove("is-visible");
      }
    });
  });

  const specialties = document.querySelector(".specialties");
  const initialTrack = specialties.querySelector(".specialty-track");
  const items = Array.from(initialTrack.children, (item, itemIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "specialty group inline-flex h-[clamp(44px,4vw,64px)] cursor-pointer items-center gap-[clamp(8px,.8vw,13px)] whitespace-nowrap rounded-[10px] border border-[#f0f0f0] bg-white px-[clamp(12px,1.1vw,18px)] text-[clamp(12px,1vw,17px)] text-[#111a2d] shadow-[0_3px_9px_rgba(20,32,54,.035)] transition-[transform,box-shadow,border-color,background-color] duration-[180ms] hover:z-[1] hover:-translate-y-1.5 hover:scale-[1.04] hover:border-[#9bded3] hover:shadow-[0_10px_24px_rgba(20,32,54,.14)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#55b8ac] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 dark:border-[#344154] dark:bg-[#202d3f] dark:text-[#f5f7fb] dark:hover:border-[#55b8ac] dark:hover:bg-[#29394e]";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = item.innerHTML;
    button.querySelectorAll(".specialty-icon").forEach((icon) => {
      icon.classList.add(
        "grid",
        "size-[clamp(26px,2.5vw,40px)]",
        "shrink-0",
        "place-items-center",
        "rounded-[7px]",
        "bg-[#e4f7f4]",
        "text-[#54b9ad]",
        "transition-transform",
        "duration-200",
        "group-hover:rotate-[-8deg]",
        "group-hover:scale-110"
      );
      if (icon.classList.contains("specialty-icon--text")) {
        icon.classList.add("text-[clamp(11px,.9vw,15px)]", "font-bold");
      }
      if (itemIndex % 3 === 1) {
        icon.classList.add("bg-[#fff0ef]", "text-[#ee8b88]");
      } else if (itemIndex % 3 === 2) {
        icon.classList.add("bg-[#e8f5ff]", "text-[#4d9ee7]");
      }
      icon.querySelector("svg")?.classList.add("size-[65%]");
    });
    return button;
  });
  let rows = [];
  let previousTime = 0;

  specialties.addEventListener("click", (event) => {
    const button = event.target.closest(".specialty");
    if (!button || button.closest('[aria-hidden="true"]')) {
      return;
    }

    const isSelected = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("z-[1]", isSelected);
    button.classList.toggle("-translate-y-1.5", isSelected && !reducedMotion.matches);
    button.classList.toggle("scale-[1.04]", isSelected && !reducedMotion.matches);
    button.classList.toggle("border-[#9bded3]", isSelected);
    button.classList.toggle("shadow-[0_10px_24px_rgba(20,32,54,.14)]", isSelected);
  });

  function buildRows() {
    specialties.replaceChildren();
    specialties.classList.toggle("is-static", reducedMotion.matches);
    rows = [[], []];

    items.forEach((item, index) => rows[index % 2].push(item));

    rows = rows.map((rowItems, index) => {
      const row = document.createElement("div");
      row.className = "specialty-row w-full overflow-hidden";
      row.classList.toggle("overflow-x-auto", reducedMotion.matches);

      const track = document.createElement("div");
      track.className =
        "specialty-track flex w-max gap-[clamp(12px,1.6vw,28px)] will-change-transform";

      const group = document.createElement("div");
      group.className =
        "specialty-group flex w-max shrink-0 items-center gap-[clamp(12px,1.6vw,28px)] py-1";
      rowItems.forEach((item) => group.append(item));
      track.append(group);

      if (!reducedMotion.matches) {
        const duplicate = group.cloneNode(true);
        duplicate.setAttribute("aria-hidden", "true");
        duplicate.querySelectorAll("button").forEach((button) => {
          button.tabIndex = -1;
        });
        track.append(duplicate);
      }

      row.append(track);
      specialties.append(row);
      return {
        track,
        group,
        offset: 0,
        direction: index === 0 ? 1 : -1,
        cycleWidth: 0
      };
    });

    updateCycleWidths();
    previousTime = 0;
  }

  function updateCycleWidths() {
    rows.forEach((row) => {
      const gap = parseFloat(window.getComputedStyle(row.track).gap);
      row.cycleWidth = row.group.getBoundingClientRect().width + gap;
      positionRow(row);
    });
  }

  function positionRow(row) {
    const translateX =
      row.direction === 1 ? -row.offset : -row.cycleWidth + row.offset;
    row.track.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }

  function moveRows(time) {
    if (previousTime) {
      const elapsed = (time - previousTime) / 1000;
      rows.forEach((row) => {
        row.offset = (row.offset + elapsed * 42) % row.cycleWidth;
        positionRow(row);
      });
    }

    previousTime = time;
    if (!reducedMotion.matches) {
      requestAnimationFrame(moveRows);
    }
  }

  reducedMotion.addEventListener("change", () => {
    buildRows();
    if (!reducedMotion.matches) {
      requestAnimationFrame(moveRows);
    }
  });
  window.addEventListener("resize", updateCycleWidths);

  buildRows();
  if (!reducedMotion.matches) {
    requestAnimationFrame(moveRows);
  }
