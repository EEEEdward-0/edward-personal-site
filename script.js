// ==========================================
// Part 1: 页面元素渐显曝光观测器逻辑
// ==========================================

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

// ==========================================
// Part 2: 首屏视差滚动与全局项目链接配置
// ==========================================

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
  network: "https://github.com",
  reddit: "https://github.com",
  flight: "https://github.com",
  home: "https://github.com",
};

const projectLinks = window.projectLinks;

// ==========================================
// Part 3: 全局节点选择、卡片高亮与外链跳转
// ==========================================

const workGroups = document.querySelectorAll(".work-accordion .work-group");
const projectCards = document.querySelectorAll(".project-card[data-project]");
const infraVisual = document.querySelector(".visual-infra");
const contactToggle = document.querySelector(".contact-toggle");
const contactPopover = document.querySelector("#contact-popover");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const topbar = document.querySelector(".topbar");
let setContactOpen = () => { };

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

// ==========================================
// Part 4: 手风琴折叠展开与无障碍属性联动
// ==========================================

workGroups.forEach((item, index) => {
  const trigger = item.querySelector(".work-group-trigger");
  if (!trigger) return;

  const setOpenState = (isOpen) => {
    item.classList.toggle("is-open", isOpen);
    item.setAttribute("aria-expanded", String(isOpen));
    trigger.setAttribute("aria-expanded", String(isOpen));
  };

  setOpenState(index === 0);

  trigger.addEventListener("click", () => {
    const isCurrentlyOpen = item.classList.contains("is-open");

    workGroups.forEach((group) => {
      const groupTrigger = group.querySelector(".work-group-trigger");

      if (group === item) {
        const newState = !isCurrentlyOpen;
        group.classList.toggle("is-open", newState);
        group.setAttribute("aria-expanded", String(newState));
        if (groupTrigger) groupTrigger.setAttribute("aria-expanded", String(newState));
      } else {
        const newState = isCurrentlyOpen;
        group.classList.toggle("is-open", newState);
        group.setAttribute("aria-expanded", String(newState));
        if (groupTrigger) groupTrigger.setAttribute("aria-expanded", String(newState));
      }
    });
  });
});

// ==========================================
// Part 5: 卡片键盘监听与联系人悬浮窗交互
// ==========================================

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

// ==========================================
// Part 6: 响应式侧边栏菜单导航联动控制
// ==========================================

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

// ==========================================
// Part 7: 基础设施服务器打点动画与图标曝光激活
// ==========================================

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

// ===================================================
// Part 8: GitHub 语言图表渲染层
// ===================================================

const languageChart = document.querySelector("#language-chart");
const languageStatus = document.querySelector("#language-panel-status");
const languageInfoToggle = document.querySelector(".language-info-toggle");
const languageInfoPopover = document.querySelector("#language-info-popover");
const languageInfoText = document.querySelector("#language-info-text");

if (languageChart) {
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
    HTML: 4898314,
    Python: 426886,
    Swift: 392989,
    CSS: 87907,
    JavaScript: 33996,
    Shell: 4363,
  };

  const ensureLanguageAnimationStyles = () => {
    if (document.querySelector("#language-animation-style")) return;

    const style = document.createElement("style");
    style.id = "language-animation-style";
    style.textContent = `
      .language-chart.is-language-loading {
        min-height: 260px;
        display: grid;
        place-items: center;
      }

      .language-chart.is-language-loading::after {
        content: "正在读取 GitHub 语言统计…";
        color: rgba(60, 60, 67, 0.72);
        font-weight: 700;
        letter-spacing: 0.02em;
        animation: languageLoadingPulse 1.4s cubic-bezier(.4, 0, .2, 1) infinite;
      }

      .language-chart.is-language-ready {
        display: block;
      }

      .language-chart.is-language-ready .language-row {
        opacity: 0;
        transform: translateY(14px) scale(0.985);
        animation:
          languageRowEnter 680ms cubic-bezier(.16, 1, .3, 1) forwards;
        animation-delay: var(--language-delay);
      }

      .language-chart.is-language-ready .language-bar {
        width: var(--language-size);
        transform-origin: left center;
        transform: scaleX(0);
        animation:
          languageBarGrow var(--language-duration) cubic-bezier(.16, 1, .3, 1) forwards,
          languageBarSettle 900ms cubic-bezier(.34, 1.56, .64, 1) forwards;
        animation-delay:
          calc(var(--language-delay) + 120ms),
          calc(var(--language-delay) + var(--language-duration) - 220ms);
      }

      @keyframes languageLoadingPulse {
        0%, 100% {
          opacity: .38;
          transform: translateY(0);
        }
        50% {
          opacity: .82;
          transform: translateY(-2px);
        }
      }

      @keyframes languageRowEnter {
        0% {
          opacity: 0;
          transform: translateY(14px) scale(0.985);
        }
        65% {
          opacity: 1;
          transform: translateY(-2px) scale(1.006);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes languageBarGrow {
        0% {
          transform: scaleX(0);
          filter: saturate(.85) brightness(1.08);
        }
        72% {
          transform: scaleX(1.035);
          filter: saturate(1.12) brightness(1.04);
        }
        100% {
          transform: scaleX(1);
          filter: none;
        }
      }

      @keyframes languageBarSettle {
        0% {
          border-radius: 999px;
        }
        100% {
          border-radius: 999px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .language-chart.is-language-loading::after,
        .language-chart.is-language-ready .language-row,
        .language-chart.is-language-ready .language-bar {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const formatBytes = (bytes) => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
    return `${bytes} B`;
  };

  const setLanguageMessage = (text) => {
    if (languageStatus) languageStatus.textContent = text;
    if (languageInfoText) languageInfoText.textContent = text;
  };

  const setLanguageLoading = () => {
    ensureLanguageAnimationStyles();
    languageChart.classList.remove("is-language-ready");
    languageChart.classList.add("is-language-loading");
    languageChart.innerHTML = "";
    setLanguageMessage("正在读取 GitHub 公开仓库语言统计。");
  };

  const renderLanguages = (languageTotals, sourceText) => {
    ensureLanguageAnimationStyles();

    const entries = Object.entries(languageTotals)
      .filter(([, bytes]) => Number(bytes) > 0)
      .sort(([, aBytes], [, bBytes]) => bBytes - aBytes)
      .slice(0, 7);

    const total = entries.reduce((sum, [, bytes]) => sum + Number(bytes), 0) || 1;

    languageChart.classList.remove("is-language-loading");
    languageChart.classList.remove("is-language-ready");

    languageChart.innerHTML = entries
      .map(([language, bytes], index) => {
        const rawPercent = (Number(bytes) / total) * 100;
        const visualPercent = Math.max(rawPercent, 3);
        const color = languageColors[language] || "#8e8e93";
        const delay = 90 + index * 125;
        const duration = 1450 + index * 95;

        return `
          <div
            class="language-row"
            role="listitem"
            aria-label="${language}，${rawPercent.toFixed(1)}%，${formatBytes(Number(bytes))}"
            style="--language-delay: ${delay}ms;"
          >
            <span class="language-name">${language}</span>
            <span class="language-track" aria-hidden="true">
              <span
                class="language-bar"
                style="--language-size: ${visualPercent.toFixed(2)}%; --language-color: ${color}; --language-duration: ${duration}ms;"
              ></span>
            </span>
            <span class="language-value">${rawPercent.toFixed(1)}%</span>
          </div>
        `;
      })
      .join("");

    setLanguageMessage(sourceText);

    window.requestAnimationFrame(() => {
      languageChart.classList.add("is-language-ready");
    });
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
    setLanguageLoading();

    try {
      const languageEndpoint =
        languageChart.dataset.languageEndpoint || "/api/github-languages";

      const response = await fetch(languageEndpoint, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`GitHub language endpoint failed: ${response.status}`);
      }

      const payload = await response.json();

      if (payload?.languages && Object.keys(payload.languages).length > 0) {
        renderLanguages(payload.languages, "数据由 GitHub API 提供，基于公开仓库语言字节数统计。");
        return;
      }

      throw new Error("Empty language payload");
    } catch (error) {
      renderLanguages(fallbackLanguages, "未读取到 GitHub 数据，当前展示已缓存的语言统计。");
    }
  };

  loadGitHubLanguages();
}

// ==========================================
// Part 9: 监控图表曲线生成与采样队列处理
// ==========================================

const agentDashboard = document.querySelector("[data-agent-dashboard]");
if (agentDashboard) {
  const agentTrigger = agentDashboard.querySelector(".agent-dashboard-trigger");
  const agentBody = agentDashboard.querySelector("#agent-dashboard-body");
  const agentTitle = agentDashboard.querySelector("#agent-dashboard-title");
  const agentSummary = agentDashboard.querySelector("[data-agent-summary]");
  const agentStatus = agentDashboard.querySelector("[data-agent-status]");
  const agentSource = agentDashboard.querySelector("[data-agent-source]");
  const agentState = agentDashboard.querySelector("[data-agent-state]");
  const agentCpu = agentDashboard.querySelector("[data-agent-cpu]");
  const agentCpuNote = agentDashboard.querySelector("[data-agent-cpu-note]");
  const agentMemory = agentDashboard.querySelector("[data-agent-memory]");
  const agentMemoryNote = agentDashboard.querySelector("[data-agent-memory-note]");
  const agentProcessCount = agentDashboard.querySelector("[data-agent-process-count]");
  const agentActiveCount = agentDashboard.querySelector("[data-agent-active-count]");
  const agentRefresh = agentDashboard.querySelector("[data-agent-refresh]");
  const agentCapability = agentDashboard.querySelector("[data-agent-capability]");
  const agentModel = agentDashboard.querySelector("[data-agent-model]");
  const agentSparklines = agentDashboard.querySelectorAll("[data-agent-sparkline]");
  const agentChartArea = agentDashboard.querySelector("[data-agent-chart-area]");
  const agentChartLines = agentDashboard.querySelectorAll("[data-agent-chart-line]");

  let agentStatusTimer = null;
  const agentHistory = [];
  const maxAgentHistory = 60;

  const getSeriesPath = (values, width = 120, height = 36, maxValue) => {
    if (values.length === 0) return "";
    const safeMax = Math.max(maxValue || Math.max(...values), 1);
    return values
      .map((value, index) => {
        const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
        const y = height - (Math.max(0, value) / safeMax) * (height - 4) - 2;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  const getAreaPath = (values, width = 640, height = 220, maxValue) => {
    const line = getSeriesPath(values, width, height, maxValue);
    if (!line) return "";
    return `${line} L ${width} ${height} L 0 ${height} Z`;
  };

  const updateAgentCharts = () => {
    const cpuValues = agentHistory.map((entry) => entry.cpuPercent || 0);
    const memoryValues = agentHistory.map((entry) => entry.memoryMb || 0);
    const processValues = agentHistory.map((entry) => entry.processCount || 0);
    const activeValues = agentHistory.map((entry) => entry.activeProcessCount || 0);

    const cpuMax = Math.max(100, ...cpuValues);
    const memoryMax = Math.max(1024, ...memoryValues);
    const processMax = Math.max(10, ...processValues);
    const activeMax = Math.max(4, ...activeValues);

    agentSparklines.forEach((path) => {
      const type = path.dataset.agentSparkline;
      if (type === "cpu") path.setAttribute("d", getSeriesPath(cpuValues, 120, 36, cpuMax));
      if (type === "memory") path.setAttribute("d", getSeriesPath(memoryValues, 120, 36, memoryMax));
      if (type === "process") path.setAttribute("d", getSeriesPath(processValues, 120, 36, processMax));
      if (type === "active") path.setAttribute("d", getSeriesPath(activeValues, 120, 36, activeMax));
    });

    agentChartLines.forEach((path) => {
      const type = path.dataset.agentChartLine;
      if (type === "cpu") path.setAttribute("d", getSeriesPath(cpuValues, 640, 220, cpuMax));
      if (type === "memory") path.setAttribute("d", getSeriesPath(memoryValues, 640, 220, memoryMax));
    });

    if (agentChartArea) {
      agentChartArea.setAttribute("d", getAreaPath(cpuValues, 640, 220, cpuMax));
    }
  };

  const pushAgentSample = (payload) => {
    agentHistory.push({
      activeProcessCount: payload.activeProcessCount || 0,
      cpuPercent: payload.cpuPercent || 0,
      memoryMb: payload.memoryMb || 0,
      processCount: payload.processCount || 0,
      checkedAt: payload.checkedAt || new Date().toISOString(),
    });
    if (agentHistory.length > maxAgentHistory) {
      agentHistory.splice(0, agentHistory.length - maxAgentHistory);
    }
    updateAgentCharts();
  };

  const setAgentBodyOpen = (isOpen) => {
    if (!agentTrigger || !agentBody || agentTrigger.disabled) return;
    agentTrigger.setAttribute("aria-expanded", String(isOpen));
    agentDashboard.classList.toggle("is-open", isOpen);
    agentBody.hidden = !isOpen;
  };

  // ===================================================
  // Part 10: 硬件嗅探、隐式图片探针、AI 补丁与最终大闭环
  // ===================================================

  const setAgentUnavailable = (summary = "未检测到可读取的本机 Agent 状态接口。") => {
    agentDashboard.classList.add("is-unavailable");
    agentDashboard.classList.remove("is-ready", "is-runtime", "is-running", "is-idle");
    if (agentTitle) agentTitle.textContent = "当前未找到支持的 Agent 模型";
    if (agentSummary) agentSummary.textContent = summary;
    if (agentStatus) agentStatus.textContent = "Unavailable";
    if (agentSource) agentSource.textContent = "等待检测";
    if (agentState) agentState.textContent = "未连接";
    if (agentCpu) agentCpu.textContent = "--";
    if (agentCpuNote) agentCpuNote.textContent = "运行环境待采样";
    if (agentMemory) agentMemory.textContent = "--";
    if (agentMemoryNote) agentMemoryNote.textContent = "未连接本机桥";
    if (agentProcessCount) agentProcessCount.textContent = "--";
    if (agentActiveCount) agentActiveCount.textContent = "活动进程 --";
    if (agentRefresh) agentRefresh.textContent = "刷新间隔 --";
    if (agentCapability) agentCapability.textContent = "暂无";
    if (agentModel) agentModel.textContent = "无法判断";
    if (agentTrigger) {
      agentTrigger.disabled = true;
      agentTrigger.setAttribute("aria-expanded", "false");
    }
    if (agentBody) agentBody.hidden = true;
  };

  const setAgentReady = (payload) => {
    const isBrowserRuntime = payload.kind === "browser-runtime";
    const activityState = payload.activityState || (isBrowserRuntime ? "idle" : "running");
    agentDashboard.classList.remove("is-unavailable");
    agentDashboard.classList.add("is-ready");
    agentDashboard.classList.toggle("is-runtime", isBrowserRuntime);
    agentDashboard.classList.toggle("is-running", activityState === "running");
    agentDashboard.classList.toggle("is-idle", activityState === "idle");

    if (agentTitle) {
      agentTitle.textContent = payload.title || (isBrowserRuntime ? "浏览器运行能力已检测" : "Agent 仪表盘");
    }
    if (agentSummary) {
      agentSummary.textContent = payload.summary || "检测到可用的 Agent 或浏览器 AI 能力。";
    }
    if (agentStatus) agentStatus.textContent = payload.status || "Available";
    if (agentSource) agentSource.textContent = payload.source || "浏览器能力";
    if (agentState) agentState.textContent = payload.state || "可用";
    if (agentCpu) agentCpu.textContent = typeof payload.cpuPercent === "number" ? `${payload.cpuPercent.toFixed(1)}%` : "--";

    if (agentCpuNote) {
      agentCpuNote.textContent =
        typeof payload.cpuCoreCount === "number"
          ? `按 ${payload.cpuCoreCount} 核归一化`
          : typeof payload.activeProcessCount === "number"
            ? `${payload.activeProcessCount} 个进程有活动`
            : "运行环境待采样";
    }
    if (agentMemory) agentMemory.textContent = typeof payload.memoryMb === "number" ? `${payload.memoryMb.toFixed(1)} MB` : "--";
    if (agentMemoryNote) {
      agentMemoryNote.textContent = typeof payload.memoryMb === "number" ? "RSS 合计" : "未连接本机桥";
    }
    if (agentProcessCount) {
      agentProcessCount.textContent = typeof payload.processCount === "number" ? payload.processCount.toLocaleString("zh-CN") : "--";
    }
    if (agentActiveCount) {
      agentActiveCount.textContent = typeof payload.activeProcessCount === "number" ? `活动进程 ${payload.activeProcessCount}` : "活动进程 --";
    }
    if (agentRefresh) {
      agentRefresh.textContent = payload.refreshMs ? `刷新间隔 ${(payload.refreshMs / 1000).toFixed(0)}s` : "刷新间隔 --";
    }
    if (agentCapability) agentCapability.textContent = payload.capability || "基础状态读取";
    if (agentModel) agentModel.textContent = payload.modelProvider || "未暴露具体模型";
    if (agentTrigger) agentTrigger.disabled = false;
    pushAgentSample(payload);
  };

  const fetchJsonWithTimeout = async (url, timeout = 1200) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const detectBrowserLlmRuntime = async () => {
    if (!("gpu" in navigator)) return null;
    let adapter = null;
    try {
      adapter = await navigator.gpu.requestAdapter();
    } catch (error) {
      adapter = null;
    }
    if (!adapter) return null;

    let builtInAiAvailability = null;
    const languageModel = globalThis.LanguageModel || globalThis.ai?.languageModel;
    if (languageModel?.availability) {
      try {
        builtInAiAvailability = await languageModel.availability();
      } catch (error) {
        builtInAiAvailability = null;
      }
    }

    const hasUsableBuiltInAi =
      builtInAiAvailability && !["unavailable", "no"].includes(String(builtInAiAvailability).toLowerCase());

    return {
      available: true,
      kind: "browser-runtime",
      title: "浏览器运行能力已检测",
      source: "浏览器 WebGPU 能力",
      state: "WebGPU 可用",
      status: "Runtime",
      activityState: "idle",
      refreshMs: 5000,
      capability: "WebGPU 运行环境",
      modelProvider: hasUsableBuiltInAi
        ? `Chrome Built-in AI 可用（状态：${builtInAiAvailability}）`
        : builtInAiAvailability
          ? `Chrome Built-in AI 接口存在，但当前状态为 ${builtInAiAvailability}`
          : "未加载具体模型文件",
      summary: hasUsableBuiltInAi
        ? "检测到浏览器支持 WebGPU，并暴露 Chrome Built-in AI 语言模型接口；可作为端侧 AI 运行能力展示。"
        : builtInAiAvailability
          ? "检测到浏览器支持 WebGPU，并暴露 Chrome Built-in AI 接口；但当前内置模型状态不可用。"
          : "检测到浏览器支持 WebGPU，可作为端侧推理运行环境展示；当前页面尚未加载具体模型文件。",
    };
  };

  if (window.ai && window.ai.languageModel) {
    const originalCreate = window.ai.languageModel.create;
    window.ai.languageModel.create = async function (options = {}) {
      options.expectedLanguage = options.expectedLanguage || 'en';
      return originalCreate.call(window.ai.languageModel, options);
    };
  }

  const loadAgentStatus = async () => {
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (isLocalPreview) {
    const localAgentEndpoints = [
      "http://127.0.0.1:8788/status",
      "http://127.0.0.1:8788",
      "http://localhost:8788/status",
      "http://localhost:8788",
    ];

    for (const endpoint of localAgentEndpoints) {
      const payload = await fetchJsonWithTimeout(endpoint);
      if (payload?.available) {
        setAgentReady(payload);
        return payload.refreshMs || 1000;
      }
    }
  }

  const browserRuntime = await detectBrowserLlmRuntime();
  if (browserRuntime) {
    setAgentReady(browserRuntime);
  } else {
    setAgentUnavailable("未检测到可读取的本机 Agent 状态接口；当前浏览器也不满足 WebGPU 端侧推理运行条件。");
  }

  return 15000;
};

  const scheduleAgentStatusLoad = async () => {
    window.clearTimeout(agentStatusTimer);
    const nextRefreshMs = await loadAgentStatus();
    agentStatusTimer = window.setTimeout(scheduleAgentStatusLoad, nextRefreshMs || 15000);
  };

  agentTrigger?.addEventListener("click", () => {
    setAgentBodyOpen(agentTrigger.getAttribute("aria-expanded") !== "true");
  });

  scheduleAgentStatusLoad();
}