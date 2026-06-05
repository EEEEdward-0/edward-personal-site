const copy = {
  "zh-CN": {
    scan: "运行诊断",
    export: "导出 JSON",
    healthy: "系统状态稳定。缓存命中率较高，错误率处于可接受范围。",
    warning: "发现轻微风险。建议先检查缓存策略和上游响应时间。",
    critical: "发现明显异常。需要优先处理错误率和资源压力。",
    metrics: ["延迟", "错误率", "缓存命中", "CPU 压力"],
    steps: ["采集指标", "识别风险", "生成建议", "输出命令"],
    recommendations: [
      ["收紧缓存策略", "为静态资源延长缓存时间，并保留 HTML no-store。"],
      ["增加健康检查", "对 API 边界增加超时、重试和降级状态。"],
      ["拆分排障步骤", "把日志、指标和回滚命令固化为可复用清单。"]
    ]
  },
  "en-US": {
    scan: "Run Check",
    export: "Export JSON",
    healthy: "The service looks stable. Cache hit rate is strong and errors are within range.",
    warning: "Minor risk detected. Start with cache policy and upstream response time.",
    critical: "Clear risk detected. Prioritize error rate and resource pressure.",
    metrics: ["Latency", "Error rate", "Cache hit", "CPU load"],
    steps: ["Collect", "Detect", "Advise", "Command"],
    recommendations: [
      ["Tune caching", "Extend static asset caching while keeping HTML no-store."],
      ["Add health checks", "Add timeout, retry, and fallback states around API boundaries."],
      ["Codify response steps", "Turn logs, metrics, and rollback commands into a reusable checklist."]
    ]
  }
};

class EdgeOpsConsole extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = this.createSample();
  }

  connectedCallback() {
    this.render();
    this.bind();
    window.addEventListener("site-language-change", () => this.render());
  }

  get lang() {
    return document.documentElement.lang === "en-US" ? "en-US" : "zh-CN";
  }

  // 这是诊断台的模拟数据入口，保持前端可独立运行。
  createSample() {
    const latency = 96 + Math.round(Math.random() * 88);
    const errors = Number((0.25 + Math.random() * 1.9).toFixed(2));
    const cache = 82 + Math.round(Math.random() * 14);
    const cpu = 42 + Math.round(Math.random() * 34);
    const score = Math.max(52, Math.round(100 - errors * 8 - Math.max(0, latency - 120) * 0.16 - Math.max(0, cpu - 65) * 0.5));

    return { latency, errors, cache, cpu, score, checkedAt: new Date().toISOString() };
  }

  getTone() {
    if (this.state.score >= 82) return "healthy";
    if (this.state.score >= 68) return "warning";
    return "critical";
  }

  getCommand() {
    return [
      "wrangler pages deployment tail --project-name edward-personal-site",
      "curl -I https://itwork.dpdns.org",
      "node scripts/agent-status-bridge.mjs",
      "npm run build"
    ].join("\n");
  }

  render() {
    const t = copy[this.lang];
    const tone = this.getTone();
    const values = [
      `${this.state.latency}ms`,
      `${this.state.errors}%`,
      `${this.state.cache}%`,
      `${this.state.cpu}%`
    ];

    this.shadowRoot.innerHTML = `
      <style>@import "./styles/edge-ops-console.css?v=site-style-16";</style>
      <section class="ops-console">
        <div class="ops-card ops-main">
          <div class="ops-toolbar">
            <p class="ops-label">Pipeline</p>
            <div class="ops-actions">
              <button class="ops-button" data-action="scan">${t.scan}</button>
              <button class="ops-button secondary" data-action="export">${t.export}</button>
            </div>
          </div>

          <div class="ops-grid">
            ${t.metrics.map((label, index) => `
              <article class="ops-metric">
                <span>${label}</span>
                <strong>${values[index]}</strong>
                <small>${index === 0 ? "p95" : index === 1 ? "5xx" : index === 2 ? "edge" : "avg"}</small>
              </article>
            `).join("")}
          </div>

          <div class="ops-pipeline">
            ${t.steps.map((step, index) => `
              <article class="ops-step ${index <= 2 ? "is-active" : ""}">
                <span>0${index + 1}</span>
                <strong>${step}</strong>
              </article>
            `).join("")}
          </div>
        </div>

        <aside class="ops-side">
          <section class="ops-card ops-panel">
            <div class="ops-health">
              <div class="ops-ring" style="--ops-score: ${this.state.score}%">
                <strong>${this.state.score}</strong>
              </div>
              <p class="ops-status">${t[tone]}</p>
            </div>
          </section>

          <section class="ops-card ops-panel">
            <p class="ops-label">Actions</p>
            <ul class="ops-list">
              ${t.recommendations.map(([title, detail]) => `
                <li><strong>${title}</strong><small>${detail}</small></li>
              `).join("")}
            </ul>
          </section>

          <section class="ops-card ops-panel">
            <p class="ops-label">Runbook</p>
            <pre class="ops-code">${this.getCommand()}</pre>
          </section>
        </aside>
      </section>
    `;
  }

  bind() {
    this.shadowRoot.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      if (action === "scan") {
        this.state = this.createSample();
        this.render();
      }

      if (action === "export") {
        this.exportJson();
      }
    });
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edge-ops-diagnostic.json";
    link.click();
    URL.revokeObjectURL(url);
  }
}

customElements.define("edge-ops-console", EdgeOpsConsole);
