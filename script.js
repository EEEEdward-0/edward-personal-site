const revealItems = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

const heroMedia = document.querySelector(".hero-media img");
const depthLayers = document.querySelectorAll(".hero-depth");

window.addEventListener(
  "scroll",
  () => {
    const y = window.scrollY;
    if (heroMedia) {
      heroMedia.style.transform = `scale(1.03) translateY(${y * 0.018}px)`;
    }
    depthLayers.forEach((layer, index) => {
      const shift = y * (index === 0 ? 0.024 : -0.018);
      layer.style.marginTop = `${shift}px`;
    });
  },
  { passive: true }
);

window.projectLinks = {
  network: "https://github.com/EEEEdward-0/swift-network-anomaly-monitor",
  reddit: "https://github.com/EEEEdward-0/MSc-Project",
  flight: "https://github.com/EEEEdward-0/CSMBD",
  home: "https://github.com/EEEEdward-0",
};

const projectLinks = window.projectLinks;

const workGroups = document.querySelectorAll(".work-accordion .work-group");
const projectCards = document.querySelectorAll(".project-card[data-project]");
const infraVisual = document.querySelector(".visual-infra");
const contactToggle = document.querySelector(".contact-toggle");
const contactPopover = document.querySelector("#contact-popover");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

const selectProject = (projectId) => {
  projectCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.project === projectId);
  });
};

const openProjectLink = (projectId) => {
  const url = projectLinks[projectId];
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

workGroups.forEach((item, index) => {
  const trigger = item.querySelector(".work-group-trigger");
  if (!trigger) return;

  const setOpenState = (isOpen) => {
    item.classList.toggle("is-open", isOpen);
    item.setAttribute("aria-expanded", String(isOpen));
    trigger.setAttribute("aria-expanded", String(isOpen));
  };

  // 初始状态：index 0 默认展开，其他关闭
  setOpenState(index === 0);

trigger.addEventListener("click", () => {
    // 获取当前点击的面板是否已经展开
    const isCurrentlyOpen = item.classList.contains("is-open");

    // 逻辑：
    // 1. 遍历所有工作组
    workGroups.forEach((group) => {
      const groupTrigger = group.querySelector(".work-group-trigger");
      
      // 如果当前遍历到的是刚才被点击的那个面板
      if (group === item) {
        // 如果它原本是展开的，则执行收起；如果是关闭的，则执行展开
        // 从而实现“点一下就反转状态”的效果
        const newState = !isCurrentlyOpen;
        group.classList.toggle("is-open", newState);
        group.setAttribute("aria-expanded", String(newState));
        if (groupTrigger) groupTrigger.setAttribute("aria-expanded", String(newState));
      } else {
        // 关键点：对于另一个面板，强制设置为与当前面板“相反”的状态
        // 如果当前面板被收起了，另一个就强制展开；如果当前被展开了，另一个就强制收起
        const newState = isCurrentlyOpen; // 即：另一个的状态 = 当前原本的状态
        group.classList.toggle("is-open", newState);
        group.setAttribute("aria-expanded", String(newState));
        if (groupTrigger) groupTrigger.setAttribute("aria-expanded", String(newState));
      }
    });
  });
});

projectCards.forEach((card) => {
  card.addEventListener("click", () => openProjectLink(card.dataset.project));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectLink(card.dataset.project);
    }
  });
  card.addEventListener("focus", () => selectProject(card.dataset.project));
});

if (contactToggle && contactPopover) {
  const setContactOpen = (isOpen) => {
    contactToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      contactPopover.hidden = false;
      window.requestAnimationFrame(() => {
        contactPopover.classList.add("is-open");
      });
    } else {
      contactPopover.classList.remove("is-open");
      window.setTimeout(() => {
        if (!contactPopover.classList.contains("is-open")) {
          contactPopover.hidden = true;
        }
      }, 220);
    }
  };

  contactToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setContactOpen(contactToggle.getAttribute("aria-expanded") !== "true");
  });

  contactPopover.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => setContactOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setContactOpen(false);
    }
  });
}

if (menuToggle && navLinks) {
  const compactNav = window.matchMedia("(max-width: 960px)");

  const setMenuOpen = (isOpen) => {
    document.querySelector(".topbar")?.classList.toggle("is-menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "收起导航菜单" : "展开导航菜单");
    navLinks.toggleAttribute("inert", compactNav.matches && !isOpen);
    navLinks.setAttribute("aria-hidden", String(compactNav.matches && !isOpen));
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".topbar")) setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  const syncCompactNav = () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(compactNav.matches ? isOpen : false);
    if (!compactNav.matches) {
      navLinks.removeAttribute("inert");
      navLinks.removeAttribute("aria-hidden");
    }
  };

  compactNav.addEventListener("change", syncCompactNav);
  syncCompactNav();
}

if (infraVisual) {
  const serverDots = [...infraVisual.querySelectorAll("b")];
  let infraTimers = [];

  const clearInfraTimers = () => {
    infraTimers.forEach((timer) => window.clearTimeout(timer));
    infraTimers = [];
  };

  const setDotState = (dot, isActive) => {
    dot.style.opacity = isActive ? "1" : String(0.16 + Math.random() * 0.28);
    dot.style.backgroundColor = isActive ? "#30d158" : "#8e8e93";
    dot.style.boxShadow = isActive ? "0 0 12px rgba(48, 209, 88, 0.28)" : "none";
  };

  const completeInfraStatus = () => {
    clearInfraTimers();
    infraVisual.classList.remove("is-playing");
    infraVisual.classList.add("is-complete");
    serverDots.forEach((dot) => setDotState(dot, true));
  };

  const playInfraStatus = () => {
    clearInfraTimers();
    infraVisual.classList.remove("is-playing", "is-complete");
    window.requestAnimationFrame(() => {
      infraVisual.classList.add("is-playing");

      serverDots.forEach((dot) => setDotState(dot, Math.random() > 0.44));
      serverDots.forEach((dot) => {
        const flickerCount = 4 + Math.floor(Math.random() * 5);
        for (let index = 0; index < flickerCount; index += 1) {
          const delay = 80 + Math.floor(Math.random() * 1380);
          infraTimers.push(
            window.setTimeout(() => {
              setDotState(dot, Math.random() > 0.42);
            }, delay)
          );
        }
      });

      infraTimers.push(window.setTimeout(completeInfraStatus, 1800));
    });
  };

  const infraObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playInfraStatus();
        } else {
          clearInfraTimers();
          infraVisual.classList.remove("is-playing", "is-complete");
          serverDots.forEach((dot) => {
            dot.removeAttribute("style");
          });
        }
      });
    },
    { threshold: 0.42 }
  );

  infraObserver.observe(infraVisual);
}

const root = document.documentElement;
const projectIcons = document.querySelectorAll(".project-icon");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const playProjectIcon = (icon) => {
  if (prefersReducedMotion.matches) return;
  icon.classList.remove("is-animating");
  void icon.offsetWidth;
  icon.classList.add("is-animating");
  window.setTimeout(() => icon.classList.remove("is-animating"), 1900);
};

if (projectIcons.length > 0) {
  const iconObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.dataset.played !== "true") {
          entry.target.dataset.played = "true";
          playProjectIcon(entry.target);
        }
        if (!entry.isIntersecting) {
          entry.target.dataset.played = "false";
        }
      });
    },
    { threshold: 0.58, rootMargin: "0px 0px -8% 0px" }
  );

  projectIcons.forEach((icon) => {
    iconObserver.observe(icon);
    icon.addEventListener("pointerenter", () => playProjectIcon(icon));
    icon.addEventListener("focusin", () => playProjectIcon(icon));
    icon.addEventListener("touchstart", () => playProjectIcon(icon), { passive: true });
  });
}
