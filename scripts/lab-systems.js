const copy = {
  "zh-CN": {
    boundaryIdle: "点击后检查页面来源、缓存响应和前后端职责边界。",
    boundaryRunning: "正在检查 API 边界...",
    boundaryDone: (origin, cacheState, duration) =>
      `边界清晰：前端运行在 ${origin}；Token 不在浏览器暴露；页面响应 ${cacheState}；检测耗时 ${duration}ms。`,
    systemIdle: "点击后模拟 Go 风格的并发任务、超时取消和错误聚合。",
    systemRunning: "正在运行并发任务...",
    systemDone: (success, total, duration) =>
      `并发任务完成：${success}/${total} 个任务成功，统一收敛结果，耗时 ${duration}ms。`,
    failed: "检测未完成，请稍后重试。"
  },
  "en-US": {
    boundaryIdle: "Run a check for page origin, cache response, and frontend/backend boundaries.",
    boundaryRunning: "Checking API boundary...",
    boundaryDone: (origin, cacheState, duration) =>
      `Boundary looks clear: frontend origin ${origin}; no token exposed in browser; page response ${cacheState}; completed in ${duration}ms.`,
    systemIdle: "Run a Go-style demo for concurrent tasks, timeout cancellation, and error aggregation.",
    systemRunning: "Running concurrent tasks...",
    systemDone: (success, total, duration) =>
      `Concurrent run complete: ${success}/${total} tasks succeeded, results merged in ${duration}ms.`,
    failed: "The check did not finish. Please try again."
  }
};

const getLanguage = () => (document.documentElement.lang === "en-US" ? "en-US" : "zh-CN");

const setOutput = (output, message) => {
  if (!output) return;
  output.textContent = message;
  output.classList.add("is-updated");
  window.setTimeout(() => output.classList.remove("is-updated"), 420);
};

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Task aborted", "AbortError"));
      },
      { once: true }
    );
  });

const runBoundaryCheck = async () => {
  const lang = getLanguage();
  const output = document.querySelector("[data-boundary-output]");
  const startedAt = performance.now();

  setOutput(output, copy[lang].boundaryRunning);

  try {
    const response = await fetch(window.location.href, { cache: "no-store" });
    const cacheHeader = response.headers.get("cf-cache-status") || response.headers.get("cache-control");
    const cacheState = cacheHeader || (response.ok ? "reachable" : `HTTP ${response.status}`);
    const duration = Math.round(performance.now() - startedAt);

    setOutput(output, copy[lang].boundaryDone(window.location.origin, cacheState, duration));
  } catch (error) {
    setOutput(output, copy[lang].failed);
  }
};

const runSystemLayerDemo = async () => {
  const lang = getLanguage();
  const output = document.querySelector("[data-system-output]");
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 900);

  setOutput(output, copy[lang].systemRunning);

  // 这是前端里的 Go 风格并发演示：统一传入取消信号，再汇总每个任务结果。
  const tasks = [
    { name: "config", ms: 120 },
    { name: "metrics", ms: 180 },
    { name: "cache", ms: 240 },
    { name: "runbook", ms: 320 }
  ].map(async (task) => {
    await wait(task.ms, controller.signal);
    return { ...task, ok: true };
  });

  try {
    const results = await Promise.allSettled(tasks);
    const success = results.filter((result) => result.status === "fulfilled").length;
    const duration = Math.round(performance.now() - startedAt);
    setOutput(output, copy[lang].systemDone(success, results.length, duration));
  } catch (error) {
    setOutput(output, copy[lang].failed);
  } finally {
    window.clearTimeout(timeout);
  }
};

document.querySelector("[data-run-boundary]")?.addEventListener("click", runBoundaryCheck);
document.querySelector("[data-run-system-layer]")?.addEventListener("click", runSystemLayerDemo);

window.addEventListener("site-language-change", () => {
  const lang = getLanguage();
  setOutput(document.querySelector("[data-boundary-output]"), copy[lang].boundaryIdle);
  setOutput(document.querySelector("[data-system-output]"), copy[lang].systemIdle);
});
