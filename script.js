// ==========================================
// Part 1: 元素曝光、视差滚动与全局项目链接配置
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
// Part 2: 手风琴折叠、卡片监听与联系人悬浮窗
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
// Part 3: 响应式菜单、基础设施动画与项目图标
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
// ==========================================
// Part 4: GitHub 代码语言图表渲染与数据处理
// ==========================================

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
      .sort(([, bBytes], [, aBytes]) => bBytes - aBytes)
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
        if (payload?.languages && Object.keys(payload.languages).length > 0) {
          renderLanguages(payload.languages, "基于 GitHub 公开仓库语言字节数统计。");
          return;
        }
      }
      throw new Error("Fallback to client fetching");
    } catch (error) {
      renderLanguages(fallbackLanguages, "GitHub API 暂不可用，当前展示本地项目技术栈估算。");
    }
  };

  renderLanguages(fallbackLanguages, "正在读取 GitHub 公开仓库语言统计。");
  loadGitHubLanguages();
}
// ===================================================
// Part 5-1: 监控大盘数据采样与 Canvas / SVG 路径计算生成
// ===================================================

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
  // Part 5-2: 监控面板就绪赋值、本地网桥幽灵探针与最终闭合
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
      agentTitle.textContent = payload.title || (isBrowserRuntime ? "浏览器端 LLM Runtime 可用" : "Agent 仪表盘");
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
      title: "浏览器端 LLM Runtime 可用",
      source: "WebGPU / MediaPipe LLM Inference",
      state: "WebGPU 已就绪",
      status: "Runtime",
      activityState: "idle",
      refreshMs: 5000,
      capability: "端侧 LLM 推理环境",
      modelProvider: hasUsableBuiltInAi
        ? `可能是 Google Gemini Nano（Chrome Built-in AI: ${builtInAiAvailability}）`
        : builtInAiAvailability
          ? `无法确认；Chrome Built-in AI 接口存在，但当前状态为 ${builtInAiAvailability}`
          : "无法判断；MediaPipe/WebGPU 是运行环境，具体厂商取决于加载的模型文件",
      summary: hasUsableBuiltInAi
        ? "检测到当前浏览器可创建 WebGPU Adapter，且存在 Chrome Built-in AI 语言模型接口；该接口通常对应 Google Gemini Nano。"
        : builtInAiAvailability
          ? "检测到当前浏览器可创建 WebGPU Adapter，且存在 Chrome Built-in AI 语言模型接口；但当前内置模型不可用。"
          : "检测到当前浏览器可创建 WebGPU Adapter，可接入 MediaPipe LLM Inference Web 运行时；但尚未加载具体模型文件，无法判断模型厂商。",
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
    let nextRefreshMs = 15000;
    const probe = new Image();
    probe.src = `http://127.0.0{Date.now()}`;

    probe.onload = async () => {
      try {
        const payload = await fetchJsonWithTimeout("http://127.0.0");
        if (payload?.available) {
          setAgentReady(payload);
          nextRefreshMs = payload.refreshMs || 1000;
        }
      } catch (error) { }
    };

    probe.onerror = async () => {
      const browserRuntime = await detectBrowserLlmRuntime();
      if (browserRuntime) {
        setAgentReady(browserRuntime);
      } else {
        setAgentUnavailable("未检测到可读取的本机 Agent 状态接口；当前浏览器也不满足 WebGPU 端侧 LLM 推理条件。");
      }
    };

    return nextRefreshMs;
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
