import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
const dashboardAvgConfidence = document.querySelector("#dashboardAvgConfidence");
const visionPanel = document.querySelector("#visionPanel");
const trigger = document.querySelector("#runtimeTrigger");
const panel = document.querySelector("#runtimePanel");
const unsupported = document.querySelector("#runtimeUnsupported");

const badge = document.querySelector("#runtimeBadge");
const webgpuStatus = document.querySelector("#webgpuStatus");
const gpuStatus = document.querySelector("#gpuStatus");
const memoryStatus = document.querySelector("#memoryStatus");
const cpuStatus = document.querySelector("#cpuStatus");
const runtimeChoice = document.querySelector("#runtimeChoice");
const browserStatus = document.querySelector("#browserStatus");

const imageInput = document.querySelector("#imageInput");
const imageSelect = document.querySelector("#imageSelect");
const imagePreview = document.querySelector("#imagePreview");
const visionResult = document.querySelector("#visionResult");
const predictionLabel = document.querySelector("#predictionLabel");
const predictionScore = document.querySelector("#predictionScore");
const predictionLatency = document.querySelector("#predictionLatency");

const runtimeDashboard = document.querySelector("#runtimeDashboard");
const dashboardProgress = document.querySelector("#dashboardProgress");
const dashboardAvgLatency = document.querySelector("#dashboardAvgLatency");
const dashboardLastPrediction = document.querySelector("#dashboardLastPrediction");

const historyCount = document.querySelector("#historyCount");
const historyList = document.querySelector("#historyList");
const historySearch = document.querySelector("#historySearch");
const historySort = document.querySelector("#historySort");
const exportCsv = document.querySelector("#exportCsv");
const exportExcel = document.querySelector("#exportExcel");
const clearHistory = document.querySelector("#clearHistory");

const MIN_LOADING_TIME = 900;
const HISTORY_STORAGE_KEY = "runtimeProbeHistoryV1";
const MAX_HISTORY_ITEMS = 30;

env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
env.allowLocalModels = false;

let imageClassifier = null;
let inferenceHistory = loadHistory();
let currentImageUrl = null;

globalThis.runtimeProbeHistory = inferenceHistory;
console.log("Runtime Probe loaded: vision-dashboard-11");

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function setText(element, value) {
    if (element) element.textContent = value;
}

function createId() {
    return crypto.randomUUID?.() || `history-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDuration(ms) {
    if (ms < 1000) return `${(ms / 1000).toFixed(1)}秒`;

    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0 && seconds > 0) return `${minutes}分${seconds}秒`;
    if (minutes > 0) return `${minutes}分`;
    return `${seconds}秒`;
}

function formatPredictionLabel(label) {
    if (!label) return "Unknown";
    return label.split(",")[0].trim() || "Unknown";
}

function getAverageConfidence() {
    const scores = inferenceHistory
        .map((item) => Number(String(item.score).replace("%", "")))
        .filter(Number.isFinite);

    if (!scores.length) return "-";

    const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    return `${average.toFixed(1)}%`;
}

function getScoreValue(item) {
    return Number(String(item.score).replace("%", "")) || 0;
}

function getLatencyValue(item) {
    return Number(item.latencyMs) || 0;
}

function sortHistory(items) {
    const sorted = [...items];

    switch (historySort?.value) {
        case "confidence-desc":
            sorted.sort((a, b) => getScoreValue(b) - getScoreValue(a));
            break;

        case "confidence-asc":
            sorted.sort((a, b) => getScoreValue(a) - getScoreValue(b));
            break;

        case "latency-desc":
            sorted.sort((a, b) => getLatencyValue(b) - getLatencyValue(a));
            break;

        case "latency-asc":
            sorted.sort((a, b) => getLatencyValue(a) - getLatencyValue(b));
            break;

        default:
            sorted.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            break;
    }

    return sorted;
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        return parsed.map((item) => ({
            id: item.id || createId(),
            createdAt: item.createdAt || new Date().toISOString(),
            file: item.file || "image",
            preview: item.preview || "",
            label: item.label || "Unknown",
            score: item.score || "-",
            latency: item.latency || "-",
            latencyMs: item.latencyMs || 0
        }));
    } catch (error) {
        console.warn("Failed to load local history:", error);
        return [];
    }
}

function saveHistory() {
    inferenceHistory = inferenceHistory.slice(-MAX_HISTORY_ITEMS);

    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(inferenceHistory));
    } catch (error) {
        console.warn("Failed to save local history, thumbnails removed:", error);
        inferenceHistory = inferenceHistory
            .map((item) => ({ ...item, preview: "" }))
            .slice(-MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(inferenceHistory));
    }

    globalThis.runtimeProbeHistory = inferenceHistory;
}

function createHistoryItem(file, result, preview) {
    return {
        id: createId(),
        createdAt: new Date().toISOString(),
        file: file?.name || "image",
        preview: preview || "",
        label: result.label,
        score: result.score,
        latency: result.latency,
        latencyMs: result.latencyMs || 0
    };
}

function addHistoryItem(item) {
    inferenceHistory.push(item);
    saveHistory();
    renderHistory();
}

function deleteHistoryItem(id) {
    inferenceHistory = inferenceHistory.filter((item) => item.id !== id);
    saveHistory();
    renderHistory();
}

function clearAllHistory() {
    inferenceHistory = [];
    saveHistory();
    renderHistory();
}

function showRuntimeDashboard() {
    if (runtimeDashboard) runtimeDashboard.hidden = false;
}

function renderHistory() {
    if (!historyList || !historyCount) return;

    const keyword = historySearch?.value.trim().toLowerCase() || "";
    const filteredHistory = inferenceHistory.filter((item) => {
        const text = `${item.file} ${item.label} ${item.score} ${item.latency}`.toLowerCase();
        return text.includes(keyword);
    });

    const sortedHistory = sortHistory(filteredHistory);

    historyCount.textContent =
        `${sortedHistory.length} / ${inferenceHistory.length} 条记录`;

    if (!sortedHistory.length) {
        historyList.innerHTML = `
            <div class="history-empty">
                暂无匹配记录
            </div>
        `;
        return;
    }

    historyList.innerHTML = sortedHistory
        .slice(0, MAX_HISTORY_ITEMS)
        .map((item) => {
            const preview = item.preview
                ? `<img src="${escapeHtml(item.preview)}" alt="${escapeHtml(item.file || item.label)}" />`
                : `<span class="history-thumb-fallback">IMG</span>`;

            return `
                <div class="history-item" data-id="${escapeHtml(item.id)}">
                    ${preview}
                    <div>
                        <strong>${escapeHtml(item.label)}</strong>
                    </div>
                    <span>${escapeHtml(item.score)}</span>
                    <span>${escapeHtml(item.latency)}</span>
                    <button class="history-delete" type="button" data-id="${escapeHtml(item.id)}">删除</button>
                </div>
            `;
        })
        .join("");
}

function createPreviewDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportHistoryAsCsv() {
    if (!inferenceHistory.length) return;

    const rows = [
        ["时间", "文件名", "识别结果", "可信度", "思考时长"],
        ...sortHistory(inferenceHistory).map((item) => [
            item.createdAt,
            item.file,
            item.label,
            item.score,
            item.latency
        ])
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadFile("runtime-history.csv", `\ufeff${csv}`, "text/csv;charset=utf-8");
}

function exportHistoryAsExcel() {
    if (!inferenceHistory.length) return;

    const rows = sortHistory(inferenceHistory).map((item) => `
        <tr>
            <td>${escapeHtml(item.createdAt)}</td>
            <td>${escapeHtml(item.file)}</td>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(item.score)}</td>
            <td>${escapeHtml(item.latency)}</td>
        </tr>
    `).join("");

    const html = `
        <html>
            <head><meta charset="UTF-8" /></head>
            <body>
                <table border="1">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>文件名</th>
                            <th>识别结果</th>
                            <th>可信度</th>
                            <th>思考时长</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
        </html>
    `;

    downloadFile("runtime-history.xls", html, "application/vnd.ms-excel;charset=utf-8");
}

function updateDashboard({ total = 0, current = 0, avgLatency = "-", lastPrediction = "-" } = {}) {
    showRuntimeDashboard();
    setText(dashboardProgress, `${current} / ${total}`);
    setText(dashboardAvgLatency, avgLatency);
    setText(dashboardAvgConfidence, getAverageConfidence());
    setText(dashboardLastPrediction, lastPrediction);
    renderHistory();
}

function getBrowserRuntime() {
    const ua = navigator.userAgent;

    if (ua.includes("Edg/") || ua.includes("OPR/") || ua.includes("Chrome/")) return "Chromium";
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "WebKit";
    if (ua.includes("Firefox/")) return "Gecko";

    return "Unknown";
}

function getMemoryStatus() {
    return navigator.deviceMemory
        ? `${navigator.deviceMemory} GB`
        : "Not Exposed";
}

function getCPUStatus() {
    return navigator.hardwareConcurrency
        ? `${navigator.hardwareConcurrency} Threads`
        : "Not Exposed";
}

function getGPUText(adapter) {
    const info = adapter.info || {};
    const values = [info.vendor, info.architecture, info.device, info.description]
        .filter(Boolean);

    return values.length ? values.join(" / ") : "Available but Not Exposed";
}

function formatGPUText(text) {
    const value = text.toLowerCase();

    if (value.includes("apple") && value.includes("metal")) return "Apple Silicon / Metal 3";
    if (value.includes("apple")) return "Apple Silicon";
    if (value.includes("nvidia")) return "NVIDIA / DirectX 12";
    if (value.includes("amd")) return "AMD / DirectX 12";
    if (value.includes("intel")) return "Intel / DirectX 12";

    return text;
}

function renderBaseInfo() {
    setText(memoryStatus, getMemoryStatus());
    setText(cpuStatus, getCPUStatus());
    setText(browserStatus, getBrowserRuntime());
}

function setLoadingState(isLoading) {
    trigger.classList.toggle("is-loading", isLoading);
    trigger.textContent = isLoading ? "Checking" : "Run Test";
}

function showUnsupported() {
    badge.classList.add("is-unsupported");
    setText(badge, "Unsupported");
    panel.hidden = true;
    unsupported.hidden = false;

    if (visionPanel) visionPanel.hidden = true;
    if (runtimeDashboard) runtimeDashboard.hidden = true;
}

async function finishLoading(startTime) {
    const elapsed = performance.now() - startTime;
    await wait(Math.max(0, MIN_LOADING_TIME - elapsed));
    setLoadingState(false);
}

function setVisionLoading(isLoading) {
    if (!imageSelect) return;

    imageSelect.classList.toggle("is-loading", isLoading);
    imageSelect.textContent = isLoading ? "Analyzing" : "Upload Image";
}

async function loadImageClassifier() {
    if (imageClassifier) return imageClassifier;

    updateDashboard({ lastPrediction: "Model Loading" });
    setVisionLoading(true);
    imageClassifier = await pipeline(
        "image-classification",
        "Xenova/vit-base-patch16-224"
    );
    updateDashboard({ lastPrediction: "Model Ready" });
    setVisionLoading(false);

    return imageClassifier;
}

async function classifyImageSource(source) {
    const start = performance.now();
    const classifier = await loadImageClassifier();
    const imageSource = typeof source === "string" ? source : source.src;
    const result = await classifier(imageSource, { topk: 1 });
    const best = result?.[0];
    const latency = performance.now() - start;

    return {
        label: formatPredictionLabel(best?.label),
        score: best?.score ? `${(best.score * 100).toFixed(1)}%` : "-",
        latency: formatDuration(latency),
        latencyMs: latency
    };
}

async function runImageClassification() {
    if (!imagePreview.src) return;

    setVisionLoading(true);
    visionResult.hidden = false;
    setText(predictionLabel, "Analyzing");
    setText(predictionScore, "-");
    setText(predictionLatency, "-");

    try {
        const result = await classifyImageSource(imagePreview);
        const sourceFile = imageInput.files?.[0];
        const preview = sourceFile ? await createPreviewDataUrl(sourceFile) : imagePreview.src;

        setText(predictionLabel, result.label);
        setText(predictionScore, result.score);
        setText(predictionLatency, result.latency);
        addHistoryItem(createHistoryItem(sourceFile, result, preview));

        updateDashboard({
            total: 1,
            current: 1,
            avgLatency: result.latency,
            lastPrediction: result.label
        });
    } catch (error) {
        console.error("Image classification error:", error);
        setText(predictionLabel, "Failed");
        setText(predictionScore, "-");
        setText(predictionLatency, "-");
    } finally {
        setVisionLoading(false);
    }
}

function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}

async function runBatchImageClassification(files) {
    if (!files.length) return;

    setVisionLoading(true);
    visionResult.hidden = false;
    setText(predictionLabel, `Analyzing ${files.length} Images`);
    setText(predictionScore, "-");
    setText(predictionLatency, "-");

    const batchStart = performance.now();
    const results = [];

    try {
        for (const file of files) {
            const imageUrl = URL.createObjectURL(file);
            await loadImageFromUrl(imageUrl);
            const result = await classifyImageSource(imageUrl);
            const preview = await createPreviewDataUrl(file);
            URL.revokeObjectURL(imageUrl);

            results.push({ file: file.name, preview, ...result });
            addHistoryItem(createHistoryItem(file, result, preview));

            updateDashboard({
                total: files.length,
                current: results.length,
                avgLatency: result.latency,
                lastPrediction: result.label
            });
        }

        const totalLatency = performance.now() - batchStart;
        const topResult = results[0];

        setText(predictionLabel, `${results.length} Images Processed`);
        setText(predictionScore, topResult ? `${topResult.label} / ${topResult.score}` : "-");
        setText(predictionLatency, formatDuration(totalLatency));

        updateDashboard({
            total: files.length,
            current: files.length,
            avgLatency: formatDuration(totalLatency / files.length),
            lastPrediction: topResult?.label || "-"
        });

        console.table(results);
    } catch (error) {
        console.error("Batch image classification error:", error);
        setText(predictionLabel, "Batch Failed");
        setText(predictionScore, "-");
        setText(predictionLatency, "-");
    } finally {
        setVisionLoading(false);
    }
}

async function runRuntimeProbe() {
    const loadingStart = performance.now();

    renderBaseInfo();
    setLoadingState(true);
    badge.classList.remove("is-unsupported");

    setText(badge, "Checking");
    setText(webgpuStatus, "Checking");
    setText(gpuStatus, "Checking");
    setText(runtimeChoice, "Checking");

    const hasWebGPU = "gpu" in navigator;

    if (!hasWebGPU) {
        setText(webgpuStatus, "Unavailable");
        setText(gpuStatus, "Unavailable");
        setText(runtimeChoice, "Cloud Worker Fallback");
        showUnsupported();
        await finishLoading(loadingStart);
        return;
    }

    let adapter = null;

    try {
        adapter = await navigator.gpu.requestAdapter();
    } catch (error) {
        console.error("WebGPU adapter error:", error);
    }

    if (!adapter) {
        setText(webgpuStatus, "Unavailable");
        setText(gpuStatus, "No Adapter Found");
        setText(runtimeChoice, "Cloud Worker Fallback");
        showUnsupported();
        await finishLoading(loadingStart);
        return;
    }

    setText(badge, "Supported");
    setText(webgpuStatus, "Available");
    setText(gpuStatus, formatGPUText(getGPUText(adapter)));
    setText(runtimeChoice, "Local GPU Inference");

    await finishLoading(loadingStart);

    panel.hidden = false;
    unsupported.hidden = true;

    if (visionPanel) visionPanel.hidden = false;

    console.log("Browser Runtime:", navigator.userAgent);
    console.log("GPU Adapter:", adapter.info);
}

renderBaseInfo();
renderHistory();

trigger?.addEventListener("click", runRuntimeProbe);

imageSelect?.addEventListener("click", () => {
    imageInput?.click();
});

imageInput?.addEventListener("change", () => {
    const files = [...(imageInput.files || [])]
        .filter((file) => file.type.startsWith("image/"));

    if (!files.length) return;

    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }

    currentImageUrl = URL.createObjectURL(files[0]);
    imagePreview.src = currentImageUrl;
    imagePreview.hidden = false;
    document.querySelector("#imagePreviewBox")?.classList.add("has-image");
    visionResult.hidden = true;

    imagePreview.onload = () => {
        if (files.length === 1) {
            runImageClassification();
        } else {
            runBatchImageClassification(files);
        }
    };
});

historySearch?.addEventListener("input", renderHistory);
historySort?.addEventListener("change", renderHistory);

historyList?.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".history-delete");
    if (!deleteButton) return;

    deleteHistoryItem(deleteButton.dataset.id);
});

clearHistory?.addEventListener("click", clearAllHistory);
exportCsv?.addEventListener("click", exportHistoryAsCsv);
exportExcel?.addEventListener("click", exportHistoryAsExcel);