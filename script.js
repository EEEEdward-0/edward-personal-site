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
const topbar = document.querySelector(".topbar");
let setContactOpen = () => {};

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
  const contactTransitionMs = 220;
  let contactCloseTimer;

  setContactOpen = (isOpen) => {
    window.clearTimeout(contactCloseTimer);
    topbar?.classList.toggle("is-contact-open", isOpen);
    contactToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      contactPopover.hidden = false;
      window.requestAnimationFrame(() => {
        contactPopover.classList.add("is-open");
      });
    } else {
      contactPopover.classList.remove("is-open");
      contactCloseTimer = window.setTimeout(() => {
        if (!contactPopover.classList.contains("is-open")) {
          contactPopover.hidden = true;
        }
      }, contactTransitionMs);
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
  const closeMenu = () => {
    if (contactToggle?.getAttribute("aria-expanded") === "true") {
      setContactOpen(false);
      window.setTimeout(() => setMenuOpen(false), 220);
      return;
    }

    setMenuOpen(false);
  };

  const setMenuOpen = (isOpen) => {
    topbar?.classList.toggle("is-menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "收起导航菜单" : "展开导航菜单");
    navLinks.toggleAttribute("inert", compactNav.matches && !isOpen);
    navLinks.setAttribute("aria-hidden", String(compactNav.matches && !isOpen));
    if (!isOpen) {
      setContactOpen(false);
    }
  };

  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuToggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      return;
    }

    setMenuOpen(true);
  });

  navLinks.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const targetUrl = new URL(link.href, window.location.href);
    const sameDocument =
      targetUrl.origin === window.location.origin &&
      targetUrl.pathname === window.location.pathname;

    if (sameDocument) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".topbar")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
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

const languageChart = document.querySelector("#language-chart");
const languageStatus = document.querySelector("#language-panel-status");
const languageInfoToggle = document.querySelector(".language-info-toggle");
const languageInfoPopover = document.querySelector("#language-info-popover");
const languageInfoText = document.querySelector("#language-info-text");

if (languageChart) {
  const githubUser = "EEEEdward-0";
  const languageColors = {
    Swift: "#111827",
    Python: "#1f6feb",
    JavaScript: "#f2cc60",
    HTML: "#f97316",
    CSS: "#38bdf8",
    Shell: "#10b981",
    Java: "#ef4444",
    "Jupyter Notebook": "#8b5cf6",
    C: "#64748b",
    "C++": "#475569",
  };
  const fallbackLanguages = {
    Python: 420000,
    Swift: 260000,
    JavaScript: 170000,
    HTML: 120000,
    CSS: 90000,
    Shell: 68000,
  };

  const formatBytes = (bytes) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
    return `${bytes} B`;
  };

  const renderLanguages = (languageTotals, sourceText) => {
    const entries = Object.entries(languageTotals)
      .filter(([, bytes]) => bytes > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
    const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;

    languageChart.innerHTML = entries
      .map(([language, bytes], index) => {
        const percent = Math.max((bytes / total) * 100, 3);
        const color = languageColors[language] || "#8e8e93";
        const duration = 2300 + Math.floor(Math.random() * 900);
        const delay = index * 110 + Math.floor(Math.random() * 120);
        const springMax = (1.018 + Math.random() * 0.035).toFixed(3);
        const springMin = (0.975 + Math.random() * 0.018).toFixed(3);
        return `
          <div class="language-row" role="listitem" aria-label="${language}，${percent.toFixed(1)}%，${formatBytes(bytes)}">
            <span class="language-name">${language}</span>
            <span class="language-track" aria-hidden="true">
              <span class="language-bar" style="--language-size: ${percent.toFixed(2)}%; --language-color: ${color}; --language-delay: ${delay}ms; --language-duration: ${duration}ms; --language-spring-max: ${springMax}; --language-spring-min: ${springMin};"></span>
            </span>
            <span class="language-value">${percent.toFixed(1)}%</span>
          </div>
        `;
      })
      .join("");

    if (languageStatus) {
      languageStatus.textContent = sourceText;
    }
    if (languageInfoText) {
      languageInfoText.textContent = sourceText;
    }
  };

  const setLanguageInfoOpen = (isOpen) => {
    if (!languageInfoToggle || !languageInfoPopover) return;
    languageInfoToggle.setAttribute("aria-expanded", String(isOpen));
    languageInfoToggle.classList.toggle("is-open", isOpen);
    if (isOpen) {
      languageInfoPopover.hidden = false;
      window.requestAnimationFrame(() => languageInfoPopover.classList.add("is-open"));
    } else {
      languageInfoPopover.classList.remove("is-open");
      window.setTimeout(() => {
        if (!languageInfoPopover.classList.contains("is-open")) {
          languageInfoPopover.hidden = true;
        }
      }, 180);
    }
  };

  if (languageInfoToggle && languageInfoPopover) {
    languageInfoToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setLanguageInfoOpen(languageInfoToggle.getAttribute("aria-expanded") !== "true");
    });

    languageInfoPopover.addEventListener("click", (event) => event.stopPropagation());

    document.addEventListener("click", () => setLanguageInfoOpen(false));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setLanguageInfoOpen(false);
    });
  }

  const loadGitHubLanguages = async () => {
    try {
      const pagesFunctionResponse = await fetch("/api/github-languages", {
        headers: { Accept: "application/json" },
      });

      if (pagesFunctionResponse.ok) {
        const payload = await pagesFunctionResponse.json();
        if (payload?.totals && Object.keys(payload.totals).length > 0) {
          renderLanguages(payload.totals, payload.sourceText || "基于 GitHub 公开仓库语言字节数统计。");
          return;
        }
      }

      const reposResponse = await fetch(`https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`);
      if (!reposResponse.ok) throw new Error("GitHub repositories unavailable");

      const repos = await reposResponse.json();
      const publicRepos = repos.filter((repo) => !repo.fork && repo.languages_url).slice(0, 18);
      const languageMaps = await Promise.all(
        publicRepos.map(async (repo) => {
          const response = await fetch(repo.languages_url);
          if (!response.ok) return {};
          return response.json();
        })
      );

      const totals = languageMaps.reduce((acc, languages) => {
        Object.entries(languages).forEach(([language, bytes]) => {
          acc[language] = (acc[language] || 0) + bytes;
        });
        return acc;
      }, {});

      if (Object.keys(totals).length === 0) throw new Error("No language data");
      renderLanguages(totals, "基于 GitHub 公开仓库语言字节数统计。");
    } catch (error) {
      renderLanguages(fallbackLanguages, "GitHub API 暂不可用，当前展示本地项目技术栈估算。");
    }
  };

  renderLanguages(fallbackLanguages, "正在读取 GitHub 公开仓库语言统计。");
  loadGitHubLanguages();
}
