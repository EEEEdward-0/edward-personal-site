const LANGUAGE_KEY = "edwardSiteLanguage";
const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"];

const dictionaries = {
  "zh-CN": {
    switchLabel: "EN",
    switchAria: "Switch to English",
    pages: {
      "/index.html": {
        title: "Edward Zheng | Notes, Builds & Experiments",
        attributes: {
          ".project-card[data-project='network']": { "aria-label": "查看项目：本地网络异常检测与可视化系统" },
          ".project-card[data-project='reddit']": { "aria-label": "查看项目：Reddit 数据隐私审计与自动化抓取工具" },
          ".project-card[data-project='flight']": { "aria-label": "查看项目：航班数据处理系统" },
          ".project-card[data-project='home']": { "aria-label": "查看项目：Home Assistant 智能家居部署" }
        },
        text: {
          ".skip-link": "跳到主要内容",
          ".brand span:last-child": "Edward Zheng",
          ".nav-links a[href='#skills']": "技能",
          ".nav-links a[href='#experience']": "经历",
          ".nav-links a[href='#projects']": "项目",
          ".contact-toggle": "联系",
          ".hero .eyebrow": "Operations · Database · Automation",
          ".hero-copy": "关注系统稳定、数据库维护与自动化工具，把复杂问题拆成清晰、可执行的解决方案。",
          ".hero-panel .panel-label": "Current Focus",
          ".hero-panel strong": "自动化运维 · 容器化部署 · AI 辅助工作流",
          ".hero-panel p": "用脚本、LLM 和基础设施经验，让排障更快，维护更稳，流程更省心。",
          "#about .section-heading .eyebrow": "Profile",
          "#about h2": "稳定系统，理顺流程，推动问题闭环",
          "#about .narrative p:nth-child(1)": "有银行生产环境和企业技术支持经历，熟悉问题排查、系统维护、流程执行与跨团队协作。技术栈覆盖 Linux、数据库、脚本开发、网络安全、容器化与数据平台。",
          "#about .narrative p:nth-child(2)": "近期完成数据科学方向学习，并持续把数据处理、端侧模型、自动化工具和基础设施经验结合起来，沉淀可复用的技术方案。",
          "#skills .section-heading .eyebrow": "Professional Skills",
          "#skills h2": "覆盖运维、数据与自动化实践",
          ".skill-card:nth-child(1) h3": "系统与数据库",
          ".skill-card:nth-child(1) p": "Linux（CentOS / Ubuntu）、Windows Server、macOS、MySQL、PostgreSQL、Oracle、SQLite。",
          ".skill-card:nth-child(2) h3": "脚本与自动化",
          ".skill-card:nth-child(2) p": "Python、Shell / Bash、HTML / JavaScript 基础，擅长把重复任务转化为可执行流程。",
          ".skill-card:nth-child(3) h3": "基础设施",
          ".skill-card:nth-child(3) p": "VMware、Docker、Dockerfile、x86 服务器、NAS、Raspberry Pi 与 Home Assistant 部署。",
          ".skill-card:nth-child(4) h3": "网络与安全",
          ".skill-card:nth-child(4) p": "TCP/IP、路由器 / 防火墙基础配置、Jump Server、SSL/TLS、MQTT 与网络安全产品支持。",
          "#experience .section-heading .eyebrow": "Work Experiences",
          "#experience h2": "跨团队、跨环境，推动问题闭环完成",
          ".work-group:nth-child(1) .work-group-title": "实习经历",
          ".work-group:nth-child(1) .work-detail:nth-child(1) h3": "亚信科技（中国）有限公司｜网络安全技术支持工程师",
          ".work-group:nth-child(1) .work-detail:nth-child(1) .time": "2021.03 - 2021.07",
          ".work-group:nth-child(1) .work-detail:nth-child(1) p": "面向 B2B / B2C 客户提供售后技术支持，日均处理 100+ 个技术故障工单，负责排查、记录、回访与升级闭环。",
          ".work-group:nth-child(1) .work-detail:nth-child(2) h3": "童装制造企业｜运营与供应链协同助理",
          ".work-group:nth-child(1) .work-detail:nth-child(2) .time": "2025.07 - 至今",
          ".work-group:nth-child(1) .work-detail:nth-child(2) p": "负责销售支持、订单跟进、ERP 录入、Excel 台账维护、物流对接与异常处理，平均每日协同约 120 件货品出库发货。",
          ".work-group:nth-child(2) .work-group-title": "正式工作",
          ".work-group:nth-child(2) .work-detail h3": "星展银行（中国）有限公司｜数据库运维工程师 DBA",
          ".work-group:nth-child(2) .work-detail .time": "2021.11 - 2022.10",
          ".work-group:nth-child(2) .work-detail p:nth-of-type(1)": "参与 APAC 数据中心 1000+ 台数据库服务器跨国远程运维，保障 Oracle / MySQL / PostgreSQL 集群稳定运行与高可用性。",
          ".work-group:nth-child(2) .work-detail p:nth-of-type(2)": "使用 Python / Shell 编写自动化维护脚本，覆盖约 700 条/日数据处理任务，相关效率提升约 50%。",
          "#projects .section-heading .eyebrow": "Project Experiences",
          "#projects h2": "优先本地化、链路清晰、结果可视化",
          ".project-card[data-project='network'] h3": "本地网络异常检测与可视化系统",
          ".project-card[data-project='reddit'] h3": "Reddit 数据隐私审计与自动化抓取工具",
          ".project-card[data-project='flight'] h3": "航班数据处理系统",
          ".project-card[data-project='home'] h3": "Home Assistant 智能家居部署",
          "#education .section-heading .eyebrow": "Education",
          "#education h2": "学习计算、练习数据、理解安全要点",
          ".education-list article:nth-child(1) p": "英国雷丁",
          ".education-list article:nth-child(2) p": "英国莱斯特",
          ".education-list article:nth-child(3) p": "中国上海",
          ".contact-panel h2": "参与稳定、可维护、可持续演进的技术工作",
          ".resume-download-card span:last-child": "简历下载"
        }
      },
      "/lab.html": {
        title: "Edward's Lab | Notes & Small Systems",
        text: {
          ".skip-link": "跳到主要内容",
          ".nav-links a[href='index.html#skills']": "技能",
          ".nav-links a[href='index.html#experience']": "经历",
          ".nav-links a[href='index.html#projects']": "项目",
          ".contact-toggle": "联系",
          ".lab-hero .eyebrow": "Lab Notes",
          ".lab-hero h1": "把实践经验，整理成可复用的小系统。",
          ".lab-hero p:not(.eyebrow)": "这里记录排障、自动化、数据处理和前端实验。每个模块都尽量讲清楚问题、方法和结果。",
          ".language-panel-copy .eyebrow": "GitHub Language Mix",
          "#language-panel-title": "代码语言分布",
          ".edge-architecture-head .eyebrow": "Local AI Runtime",
          "#edge-architecture-title": "在浏览器里运行 AI 能力",
          ".edge-architecture-head p:not(.eyebrow)": "这个模块用于观察浏览器是否具备本地 AI 运行条件，包括 WebGPU、内置 AI 接口和前端交互能力。它更关注隐私边界、响应速度和可视化表达。",
          ".edge-architecture-label": "System View",
          ".edge-architecture-aside strong": "本地运行、清晰边界、可迁移的服务思路。",
          ".edge-architecture-aside p": "这个区域只展示浏览器能力和页面交互，不读取访客本机进程，也不依赖本地服务。",
          ".edge-flow-item:nth-of-type(1)>span": "01 / Runtime Layer",
          ".edge-flow-item:nth-of-type(1) h3": "浏览器运行能力检测",
          ".edge-flow-item:nth-of-type(1) p": "检测 WebGPU、Chrome 内置 AI 接口和端侧推理准备状态，判断当前浏览器是否适合运行本地 AI 功能。",
          ".edge-flow-item:nth-of-type(1) .edge-demo-link span": "打开运行测试",
          ".edge-flow-item:nth-of-type(1) .edge-demo-link small": "浏览器 AI 能力检测",
          ".edge-flow-item:nth-of-type(2)>span": "02 / Ops Layer",
          ".edge-flow-item:nth-of-type(2) h3": "自动化运维诊断台",
          ".edge-flow-item:nth-of-type(2) p": "使用 Web Components 和前端状态管理模拟服务巡检，把指标采集、风险判断和排障建议整理成可复用工具。",
          ".ui-arch-run": "打开诊断台",
          ".edge-flow-item:nth-of-type(3)>span": "03 / Rendering Layer",
          ".edge-flow-item:nth-of-type(3) h3": "沉浸式 3D 场景",
          ".edge-flow-item:nth-of-type(3)>p": "使用 Three.js 构建 GPU 加速的 3D 场景，用轨道、节点和实时反馈表达复杂系统关系。",
          ".immersive-entry span": "打开地月场景",
          ".immersive-entry small": "Earth · Moon · ISS · LRO",
          ".edge-flow-item:nth-of-type(4)>span": "04 / Edge Boundary",
          ".edge-flow-item:nth-of-type(4) h3": "清晰的 API 边界",
          ".edge-flow-item:nth-of-type(4)>p": "使用 Cloudflare Worker 隔离 Token、缓存和外部 API 访问，让前端专注展示、交互和能力检测。",
          "[data-run-boundary]": "运行边界检查",
          "[data-boundary-output]": "点击后检查页面来源、缓存响应和前后端职责边界。",
          ".edge-flow-item:nth-of-type(5)>span": "05 / Systems Language Layer",
          ".edge-flow-item:nth-of-type(5) h3": "Go-style Backend Thinking",
          ".edge-flow-item:nth-of-type(5)>p": "以 Golang 的系统语言思路设计可迁移后端：清晰接口、并发任务、上下文取消、错误处理、缓存策略和服务边界。即使当前由 Worker 承载，也保留迁移到 Go microservice 的架构空间。",
          "[data-run-system-layer]": "运行并发任务演示",
          "[data-system-output]": "点击后模拟 Go 风格的并发任务、超时取消和错误聚合。"
        }
      },
      "/runtime-probe.html": {
        title: "浏览器 AI 运行测试",
        text: {
          ".runtime-slide:first-child .runtime-kicker": "01 / Runtime Layer",
          ".runtime-slide:first-child h1": "浏览器 AI 运行测试",
          ".runtime-desc": "检查当前浏览器是否支持 WebGPU、本地推理和内置 AI 接口。",
          "#runtimeTrigger": "开始测试",
          "#cameraPanel .runtime-kicker": "02 / Ops Layer",
          "#cameraPanel h2": "自动化运维诊断台",
          "#cameraPanel p:not(.runtime-kicker)": "模拟服务巡检、风险识别和排障建议，把运维经验做成可复用工具。",
          "#cameraLaunch": "打开诊断台",
          "#runtimePanel .runtime-kicker": "Runtime Status",
          "#runtimePanel h2": "能力检测结果",
          "#runtimeBadge": "检测中",
          ".runtime-card:nth-child(2) span": "GPU 适配器",
          ".runtime-card:nth-child(3) span": "设备内存",
          ".runtime-card:nth-child(4) span": "CPU 线程",
          ".runtime-card:nth-child(5) span": "运行方案",
          ".runtime-card:nth-child(6) span": "浏览器运行环境",
          ".vision-head .runtime-kicker": "Local Vision Inference",
          "#imageSelect": "上传图片",
          ".vision-head h2": "本地图片识别",
          ".vision-head p": "上传图片，在浏览器内完成基础识别和结果记录。",
          "#imagePreviewPlaceholder strong": "尚未选择图片",
          "#imagePreviewPlaceholder em": "上传后可在这里预览",
          ".vision-result div:nth-child(1) span": "识别结果",
          ".vision-result div:nth-child(2) span": "可信度",
          ".vision-result div:nth-child(3) span": "耗时",
          ".dashboard-head .runtime-kicker": "Runtime Dashboard",
          ".dashboard-head h3": "本地处理轨迹",
          ".dashboard-grid div:nth-child(1) span": "批处理进度",
          ".dashboard-grid div:nth-child(2) span": "平均耗时",
          ".dashboard-grid div:nth-child(3) span": "平均可信度",
          ".dashboard-grid div:nth-child(4) span": "最近识别",
          ".history-summary-title": "历史记录",
          ".history-summary-desc": "本地推理结果与处理轨迹",
          "#historySearch": "搜索识别结果或文件名",
          "#exportCsv": "导出 CSV",
          "#exportExcel": "导出 Excel",
          "#clearHistory": "清空记录",
          ".history-table-head span:nth-child(1)": "图片",
          ".history-table-head span:nth-child(2)": "识别结果",
          ".history-table-head span:nth-child(3)": "可信度",
          ".history-table-head span:nth-child(4)": "思考时长",
          ".history-table-head span:nth-child(5)": "操作",
          "#runtimeUnsupported .runtime-kicker": "Unsupported",
          "#runtimeUnsupported h2": "当前浏览器或设备不支持此功能",
          "#runtimeUnsupported p:not(.runtime-kicker)": "该 Demo 需要浏览器暴露 WebGPU 能力。如果当前环境不支持，页面将不会展开 Runtime 面板。"
        }
      },
      "/edge-ops-console.html": {
        title: "Edge Ops Console",
        text: {
          ".ops-kicker": "04 / Edge Ops Console",
          ".ops-hero h1": "自动化运维诊断台",
          ".ops-hero p:not(.ops-kicker)": "模拟一次边缘服务巡检：采集延迟、错误率、缓存命中率和资源压力，并生成可执行的排障建议。"
        }
      },
      "/immersive-lab.html": {
        title: "沉浸式地月轨道场景",
        text: {
          ".iss-kicker": "03 / IMMERSIVE EARTH VIEW",
          ".iss-copy p:not(.iss-kicker)": "基于 NASA 地球影像与 ISS 实时经纬度，模拟从国际空间站俯瞰的沉浸式视角。",
          "#loaderStage": "正在加载轨道场景",
          "#loaderDetail": "正在准备场景资源",
          "#motionToggle": "运动视角",
          "[data-sat-toggle='weather']": "天气",
          "[data-scene-focus='iss']": "ISS 细节",
          "[data-scene-focus='starlink']": "Starlink 细节",
          "[data-scene-focus='weather']": "天气细节",
          "[data-scene-focus='lro']": "月球勘测船细节",
          "[data-scene-focus='gateway']": "网关细节",
          ".immersive-footer-left span:first-child": "供电",
          ".immersive-footer strong": "由爱德华设计"
        }
      }
    }
  },
  "en-US": {
    switchLabel: "中",
    switchAria: "切换到中文",
    pages: {
      "/index.html": {
        title: "Edward Zheng | Operations, Data & Automation",
        attributes: {
          ".project-card[data-project='network']": { "aria-label": "View project: Local Network Anomaly Detection and Visualization System" },
          ".project-card[data-project='reddit']": { "aria-label": "View project: Reddit Data Privacy Audit and Automated Collection Tool" },
          ".project-card[data-project='flight']": { "aria-label": "View project: Flight Data Processing System" },
          ".project-card[data-project='home']": { "aria-label": "View project: Home Assistant Smart Home Deployment" }
        },
        text: {
          ".skip-link": "Skip to main content",
          ".nav-links a[href='#skills']": "Skills",
          ".nav-links a[href='#experience']": "Experience",
          ".nav-links a[href='#projects']": "Projects",
          ".contact-toggle": "Contact",
          ".hero .eyebrow": "Operations · Database · Automation",
          ".hero-copy": "I build practical ways to keep systems stable, maintain databases, and turn repeated work into clear automation.",
          ".hero-panel .panel-label": "Current Focus",
          ".hero-panel strong": "Automation · Containers · AI-assisted workflows",
          ".hero-panel p": "Using scripts, LLMs, and infrastructure experience to make troubleshooting faster and operations easier to maintain.",
          "#about .section-heading .eyebrow": "Profile",
          "#about h2": "Stabilize systems. Clarify workflows. Close the loop.",
          "#about .narrative p:nth-child(1)": "I have worked in banking production environments and enterprise technical support, with experience in troubleshooting, system maintenance, process execution, and cross-team collaboration. My stack covers Linux, databases, scripting, network security, containers, and data platforms.",
          "#about .narrative p:nth-child(2)": "Recently I completed data science studies and continue combining data processing, on-device models, automation tools, and infrastructure practice into reusable technical solutions.",
          "#skills .section-heading .eyebrow": "Professional Skills",
          "#skills h2": "Operations, data, and automation in practice",
          ".skill-card:nth-child(1) h3": "Systems & Databases",
          ".skill-card:nth-child(1) p": "Linux (CentOS / Ubuntu), Windows Server, macOS, MySQL, PostgreSQL, Oracle, and SQLite.",
          ".skill-card:nth-child(2) h3": "Scripting & Automation",
          ".skill-card:nth-child(2) p": "Python, Shell / Bash, and HTML / JavaScript fundamentals, with a focus on turning repeated work into executable workflows.",
          ".skill-card:nth-child(3) h3": "Infrastructure",
          ".skill-card:nth-child(3) p": "VMware, Docker, Dockerfile, x86 servers, NAS, Raspberry Pi, and Home Assistant deployment.",
          ".skill-card:nth-child(4) h3": "Networking & Security",
          ".skill-card:nth-child(4) p": "TCP/IP, router and firewall basics, Jump Server, SSL/TLS, MQTT, and network security product support.",
          "#experience .section-heading .eyebrow": "Work Experience",
          "#experience h2": "Cross-team work across production environments",
          ".work-group:nth-child(1) .work-group-title": "Internship Experience",
          ".work-group:nth-child(1) .work-detail:nth-child(1) h3": "AsiaInfo Technologies (China) | Network Security Technical Support Engineer",
          ".work-group:nth-child(1) .work-detail:nth-child(1) .time": "Mar 2021 - Jul 2021",
          ".work-group:nth-child(1) .work-detail:nth-child(1) p": "Provided after-sales technical support for B2B / B2C customers, handling 100+ technical tickets per day on average across troubleshooting, documentation, follow-up, and escalation closure.",
          ".work-group:nth-child(1) .work-detail:nth-child(2) h3": "Children's Apparel Manufacturer | Operations & Supply Chain Assistant",
          ".work-group:nth-child(1) .work-detail:nth-child(2) .time": "Jul 2025 - Present",
          ".work-group:nth-child(1) .work-detail:nth-child(2) p": "Supported sales, order follow-up, ERP entry, Excel ledger maintenance, logistics coordination, and exception handling, coordinating roughly 120 outbound items per day.",
          ".work-group:nth-child(2) .work-group-title": "Full-time Work",
          ".work-group:nth-child(2) .work-detail h3": "DBS Bank (China) | Database Operations Engineer DBA",
          ".work-group:nth-child(2) .work-detail .time": "Nov 2021 - Oct 2022",
          ".work-group:nth-child(2) .work-detail p:nth-of-type(1)": "Supported remote cross-border operations for 1000+ database servers across APAC data centers, helping maintain stable and highly available Oracle / MySQL / PostgreSQL clusters.",
          ".work-group:nth-child(2) .work-detail p:nth-of-type(2)": "Wrote Python / Shell maintenance scripts covering roughly 700 daily data-processing tasks, improving related workflow efficiency by about 50%.",
          "#projects .section-heading .eyebrow": "Project Experience",
          "#projects h2": "Local-first tools with clear data flow",
          ".project-card[data-project='network'] h3": "Local Network Anomaly Detection & Visualization System",
          ".project-card[data-project='reddit'] h3": "Reddit Data Privacy Audit & Automated Collection Tool",
          ".project-card[data-project='flight'] h3": "Flight Data Processing System",
          ".project-card[data-project='home'] h3": "Home Assistant Smart Home Deployment",
          "#education .section-heading .eyebrow": "Education",
          "#education h2": "Computing, data practice, and security fundamentals",
          ".education-list article:nth-child(1) p": "Reading, United Kingdom",
          ".education-list article:nth-child(2) p": "Leicester, United Kingdom",
          ".education-list article:nth-child(3) p": "Shanghai, China",
          ".contact-panel h2": "Contributing to stable, maintainable, and sustainable technical systems",
          ".resume-download-card span:last-child": "Download resume"
        }
      },
      "/lab.html": {
        title: "Edward's Lab | Practical Systems Notes",
        text: {
          ".skip-link": "Skip to main content",
          ".nav-links a[href='index.html#skills']": "Skills",
          ".nav-links a[href='index.html#experience']": "Experience",
          ".nav-links a[href='index.html#projects']": "Projects",
          ".contact-toggle": "Contact",
          ".lab-hero .eyebrow": "Lab Notes",
          ".lab-hero h1": "Turning field notes into reusable small systems.",
          ".lab-hero p:not(.eyebrow)": "This lab collects troubleshooting, automation, data work, and frontend experiments. Each module keeps the problem, method, and result easy to scan.",
          ".language-panel-copy .eyebrow": "GitHub Language Mix",
          "#language-panel-title": "Code language mix",
          ".edge-architecture-head .eyebrow": "Local AI Runtime",
          "#edge-architecture-title": "Running AI capabilities in the browser",
          ".edge-architecture-head p:not(.eyebrow)": "This section checks whether the browser is ready for local AI work, including WebGPU, built-in AI interfaces, and frontend interaction patterns.",
          ".edge-architecture-label": "System View",
          ".edge-architecture-aside strong": "Local execution, clear boundaries, portable service thinking.",
          ".edge-architecture-aside p": "This area only presents browser capabilities and page interactions. It does not read local processes or depend on a local service.",
          ".edge-flow-item:nth-of-type(1)>span": "01 / Runtime Layer",
          ".edge-flow-item:nth-of-type(1) h3": "Browser runtime check",
          ".edge-flow-item:nth-of-type(1) p": "Checks WebGPU, Chrome built-in AI APIs, and on-device inference readiness to decide whether this browser can run local AI features.",
          ".edge-flow-item:nth-of-type(1) .edge-demo-link span": "Open runtime check",
          ".edge-flow-item:nth-of-type(1) .edge-demo-link small": "Browser AI capability check",
          ".edge-flow-item:nth-of-type(2)>span": "02 / Ops Layer",
          ".edge-flow-item:nth-of-type(2) h3": "Edge Ops Console",
          ".edge-flow-item:nth-of-type(2) p": "A Web Components console that turns metrics, risk checks, and runbook suggestions into a reusable operations tool.",
          ".ui-arch-run": "Open console",
          ".edge-flow-item:nth-of-type(3)>span": "03 / Rendering Layer",
          ".edge-flow-item:nth-of-type(3) h3": "Immersive 3D scene",
          ".edge-flow-item:nth-of-type(3)>p": "A GPU-accelerated Three.js scene that uses orbits, nodes, and real-time feedback to explain complex system relationships.",
          ".immersive-entry span": "Open Earth-Moon scene",
          ".immersive-entry small": "Earth · Moon · ISS · LRO",
          ".edge-flow-item:nth-of-type(4)>span": "04 / Edge Boundary",
          ".edge-flow-item:nth-of-type(4) h3": "Clear API boundary",
          ".edge-flow-item:nth-of-type(4)>p": "Use a Cloudflare Worker-style boundary to isolate tokens, cache strategy, and external API access while the frontend focuses on display and interaction.",
          "[data-run-boundary]": "Run boundary check",
          "[data-boundary-output]": "Run a check for page origin, cache response, and frontend/backend boundaries.",
          ".edge-flow-item:nth-of-type(5)>span": "05 / Systems Language Layer",
          ".edge-flow-item:nth-of-type(5) h3": "Systems-language thinking",
          ".edge-flow-item:nth-of-type(5)>p": "Design portable backend logic with Go-style patterns: clear interfaces, concurrent tasks, context cancellation, error handling, caching, and service boundaries.",
          "[data-run-system-layer]": "Run concurrency demo",
          "[data-system-output]": "Run a Go-style demo for concurrent tasks, timeout cancellation, and error aggregation."
        }
      },
      "/runtime-probe.html": {
        title: "Browser AI Runtime Check",
        text: {
          ".runtime-slide:first-child .runtime-kicker": "01 / Runtime Layer",
          ".runtime-slide:first-child h1": "Browser AI runtime check",
          ".runtime-desc": "Check whether this browser supports WebGPU, local inference, and built-in AI interfaces.",
          "#runtimeTrigger": "Run check",
          "#cameraPanel .runtime-kicker": "02 / Ops Layer",
          "#cameraPanel h2": "Edge Ops Console",
          "#cameraPanel p:not(.runtime-kicker)": "Simulate service checks, risk detection, and runbook suggestions as a reusable operations tool.",
          "#cameraLaunch": "Open console",
          "#runtimePanel .runtime-kicker": "Runtime Status",
          "#runtimePanel h2": "Capability result",
          "#runtimeBadge": "Checking",
          ".runtime-card:nth-child(2) span": "GPU Adapter",
          ".runtime-card:nth-child(3) span": "Device Memory",
          ".runtime-card:nth-child(4) span": "CPU Threads",
          ".runtime-card:nth-child(5) span": "Runtime Choice",
          ".runtime-card:nth-child(6) span": "Browser Runtime",
          ".vision-head .runtime-kicker": "Local Vision Inference",
          "#imageSelect": "Upload image",
          ".vision-head h2": "Local image check",
          ".vision-head p": "Upload an image and run a basic browser-side recognition flow.",
          "#imagePreviewPlaceholder strong": "No image selected",
          "#imagePreviewPlaceholder em": "Preview appears here after upload",
          ".vision-result div:nth-child(1) span": "Prediction",
          ".vision-result div:nth-child(2) span": "Confidence",
          ".vision-result div:nth-child(3) span": "Latency",
          ".dashboard-head .runtime-kicker": "Runtime Dashboard",
          ".dashboard-head h3": "Local Processing Trace",
          ".dashboard-grid div:nth-child(1) span": "Batch Progress",
          ".dashboard-grid div:nth-child(2) span": "Average Latency",
          ".dashboard-grid div:nth-child(3) span": "Average Confidence",
          ".dashboard-grid div:nth-child(4) span": "Last Prediction",
          ".history-summary-title": "History",
          ".history-summary-desc": "Local inference results and processing trace",
          "#historySearch": "Search result or filename",
          "#exportCsv": "Export CSV",
          "#exportExcel": "Export Excel",
          "#clearHistory": "Clear history",
          ".history-table-head span:nth-child(1)": "Image",
          ".history-table-head span:nth-child(2)": "Prediction",
          ".history-table-head span:nth-child(3)": "Confidence",
          ".history-table-head span:nth-child(4)": "Latency",
          ".history-table-head span:nth-child(5)": "Action",
          "#runtimeUnsupported .runtime-kicker": "Unsupported",
          "#runtimeUnsupported h2": "This browser or device is not supported",
          "#runtimeUnsupported p:not(.runtime-kicker)": "This demo needs WebGPU support. If the current environment does not expose it, the runtime panel will stay closed."
        }
      },
      "/edge-ops-console.html": {
        title: "Edge Ops Console",
        text: {
          ".ops-kicker": "04 / Edge Ops Console",
          ".ops-hero h1": "Edge Ops Console",
          ".ops-hero p:not(.ops-kicker)": "A small operations console that samples latency, error rate, cache hit rate, and resource pressure, then turns them into actionable runbook steps."
        }
      },
      "/immersive-lab.html": {
        title: "Immersive Earth Orbit Scene",
        text: {
          ".iss-kicker": "03 / IMMERSIVE EARTH VIEW",
          ".iss-copy p:not(.iss-kicker)": "An immersive orbital view using NASA Earth imagery and live ISS position data.",
          "#loaderStage": "Loading orbital scene",
          "#loaderDetail": "Preparing scene assets",
          "#motionToggle": "Motion view",
          "[data-sat-toggle='weather']": "Weather",
          "[data-scene-focus='iss']": "ISS detail",
          "[data-scene-focus='starlink']": "Starlink detail",
          "[data-scene-focus='weather']": "Weather detail",
          "[data-scene-focus='lro']": "LRO detail",
          "[data-scene-focus='gateway']": "Gateway detail",
          ".immersive-footer-left span:first-child": "Powered by",
          ".immersive-footer strong": "Designed by Edward"
        }
      }
    }
  }
};

function getPageKey() {
  const path = window.location.pathname;
  if (path === "/" || path.endsWith("/")) return "/index.html";
  return `/${path.split("/").pop()}`;
}

function getInitialLanguage() {
  const requested = new URLSearchParams(window.location.search).get("lang");
  if (SUPPORTED_LANGUAGES.includes(requested)) {
    localStorage.setItem(LANGUAGE_KEY, requested);
    return requested;
  }

  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.placeholder = value;
      return;
    }
    element.textContent = value;
  });
}

function setAttributes(selector, attributes) {
  document.querySelectorAll(selector).forEach((element) => {
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
  });
}

function applyLanguage(language) {
  const dictionary = dictionaries[language] || dictionaries["zh-CN"];
  const page = dictionary.pages[getPageKey()] || dictionary.pages["/index.html"];

  document.documentElement.lang = language;
  if (page.title) document.title = page.title;

  Object.entries(page.text || {}).forEach(([selector, value]) => setText(selector, value));
  Object.entries(page.attributes || {}).forEach(([selector, attributes]) => setAttributes(selector, attributes));
  document.querySelectorAll("[data-language-switch]").forEach((button) => {
    button.textContent = dictionary.switchLabel;
    button.setAttribute("aria-label", dictionary.switchAria);
  });

  window.dispatchEvent(new CustomEvent("site-language-change", { detail: { language } }));
}

function createLanguageSwitch() {
  if (document.querySelector("[data-language-switch]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "language-switch";
  button.dataset.languageSwitch = "true";
  button.addEventListener("click", () => {
    const nextLanguage = document.documentElement.lang === "zh-CN" ? "en-US" : "zh-CN";
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    applyLanguage(nextLanguage);
  });

  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.appendChild(button);
  } else {
    button.classList.add("is-floating");
    document.body.appendChild(button);
  }
}

//这是全站语言入口：先插入按钮，再按用户偏好渲染本地化文案。
createLanguageSwitch();
applyLanguage(getInitialLanguage());
