# Edward Zheng | Notes, Builds & Experiments

这是 Edward Zheng 的个人网站，不只是简历页，也用于整理技术实践、项目想法、学习路径和正在探索的方向。

## 内容

- 个人简介与当前关注方向
- Professional Skills
- Work Experiences
- Project Experiences
- Education
- Contact 与站点页脚品牌信息
- Lab Notes 子页面，用于整理技术方法、实验记录与可访问性思考

## 技术

- HTML
- CSS
- JavaScript
- Responsive layout
- Apple-inspired visual style
- Accessibility: skip link, ARIA states, keyboard navigation, system high contrast / forced colors, reduced motion, reduced transparency, larger touch targets
- Multilingual UI: localized Chinese / English copy with a lightweight language switch
- Cloudflare Pages Function: proxies GitHub language statistics with an optional `GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_API_TOKEN` environment variable
- Lab Agent Dashboard: checks an optional local status bridge first, then falls back to browser WebGPU / MediaPipe LLM runtime detection

## 项目结构

```text
.
├── index.html              # 首页 / 个人简介
├── lab.html                # 技术札记入口
├── runtime-probe.html      # 浏览器原生 AI 运行测试
├── edge-ops-console.html   # 自动化运维诊断台
├── immersive-lab.html      # 沉浸式 3D 实验页
├── assets/                 # 图片、图标、简历 PDF 等静态资源
├── models/                 # 本地模型与 3D 模型资源，默认不纳入 Git
├── scripts/                # 页面交互与实验脚本
├── styles/                 # 页面样式与共享样式
├── _headers                # Cloudflare Pages 缓存头配置
└── archive/                # 本地历史备份，不发布、不纳入 Git
```

## 本机 Agent 状态桥

Lab 页面会优先读取 `http://127.0.0.1:8788/agent-status`。需要显示本机状态时，在项目目录运行：

```bash
node scripts/agent-status-bridge.mjs
```

未启动状态桥时，页面会继续检测浏览器是否支持 WebGPU，并以浏览器端 LLM Runtime 展示可用状态。

## 部署

项目托管在 GitHub，并通过 Cloudflare Pages 部署。

- GitHub: https://github.com/EEEEdward-0/edward-personal-site
- Site: https://itwork.dpdns.org
- Cloudflare Pages fallback: https://edward-personal-site.pages.dev
