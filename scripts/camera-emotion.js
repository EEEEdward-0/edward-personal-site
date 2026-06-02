
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/+esm";

const cameraPreview = document.querySelector("#cameraPreview");
const cameraVideo = document.querySelector("#cameraVideo");
const cameraCanvas = document.querySelector("#cameraCanvas");
const cameraIdle = document.querySelector("#cameraIdle");
const cameraStart = document.querySelector("#cameraStart");
const cameraStop = document.querySelector("#cameraStop");
const analyzeFrameButton = document.querySelector("#analyzeFrame");

const recordToggle = document.querySelector("#recordToggle");
const recordClear = document.querySelector("#recordClear");
const recordStatus = document.querySelector("#recordStatus");
const recordSummary = document.querySelector("#recordSummary");
const recordList = document.querySelector("#recordList");
const emotionPieChart = document.querySelector("#emotionPieChart");
const emotionPieLegend = document.querySelector("#emotionPieLegend");

const emotionState = document.querySelector("#emotionState");
const emotionDesc = document.querySelector("#emotionDesc");
const faceStatus = document.querySelector("#faceStatus");
const cameraFps = document.querySelector("#cameraFps");
const emotionConfidence = document.querySelector("#emotionConfidence");
const cameraRuntime = document.querySelector("#cameraRuntime");

const FRAME_INTERVAL = 650;
const EMOTION_MODEL_ID = "Xenova/facial_emotions_image_detection";
const YOLO_MODEL_PATH = "./models/yolov8m-face.onnx";
const REMOTE_YOLO_ENDPOINT = "/api/emotion-yolo";
const VISION_FALLBACK_ENDPOINT = "/api/emotion-vision";
const YOLO_INPUT_SIZE = 640;
const FACE_CONFIDENCE_THRESHOLD = 0.45;
const FACE_IOU_THRESHOLD = 0.45;
const REMOTE_FRAME_QUALITY = 0.82;
const REMOTE_TIMEOUT = 12000;
const DEBUG_MODE = new URLSearchParams(window.location.search).get("mode");
const IS_MOBILE_BROWSER = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function resolveInferenceMode() {
    if (DEBUG_MODE === "local") return false;
    if (DEBUG_MODE === "remote") return true;
    return IS_MOBILE_BROWSER;
}

env.allowLocalModels = false;
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
ort.env.wasm.numThreads = window.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 4) : 1;

let cameraStream = null;
let animationId = null;
let emotionClassifier = null;
let yoloSession = null;
let faceOverlay = null;
let isModelLoading = false;
let isInferencing = false;
let isRemoteMode = resolveInferenceMode();
let lastFrameTime = 0;
let lastFpsTime = 0;
let frameCounter = 0;

let isRecording = false;
let recordStartedAt = 0;
let activeRecordSegment = null;
let recordSegments = [];

const NO_CHANGE_THRESHOLD = 60000;
const RECORD_COLORS = {
    Positive: "#34c759",
    Neutral: "#8e8e93",
    Negative: "#ff3b30",
    Active: "#007aff",
    Unknown: "#af52de"
};

function setText(element, value) {
    if (element) element.textContent = value;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatRecordTime(ms) {
    const safeMs = Math.max(0, Math.round(ms));
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function getRecordLabel(state) {
    const ignoredStates = new Set([
        "Analyzing",
        "Starting",
        "Loading YOLO",
        "Loading Emotion",
        "Start Failed",
        "Unsupported",
        "Inference Failed",
        "No Face",
        "Waiting"
    ]);

    if (!state || ignoredStates.has(state)) return null;
    return RECORD_COLORS[state] ? state : "Unknown";
}

function getRecordColor(label) {
    const normalized = String(label || "Unknown").split(" · ")[0];
    return RECORD_COLORS[normalized] || RECORD_COLORS.Unknown;
}

function finalizeActiveRecordSegment(now = performance.now()) {
    if (!activeRecordSegment) return;

    activeRecordSegment.end = Math.max(activeRecordSegment.start, now - recordStartedAt);
    activeRecordSegment.duration = activeRecordSegment.end - activeRecordSegment.start;

    if (activeRecordSegment.duration >= NO_CHANGE_THRESHOLD && !activeRecordSegment.label.includes("无明显变化")) {
        activeRecordSegment.label = `${activeRecordSegment.label} · 无明显变化`;
        activeRecordSegment.note = "该状态持续超过 1 分钟，记录为无变化。";
    }

    recordSegments.push(activeRecordSegment);
    activeRecordSegment = null;
}

function getRecordPreviewSegments() {
    if (!activeRecordSegment) return [...recordSegments];

    return [
        ...recordSegments,
        {
            ...activeRecordSegment,
            end: Math.max(activeRecordSegment.start, performance.now() - recordStartedAt)
        }
    ];
}

function getEmotionStats(segments) {
    const stats = new Map();
    let total = 0;

    for (const segment of segments) {
        const duration = Math.max(0, (segment.end ?? 0) - (segment.start ?? 0));
        if (!duration) continue;

        const label = String(segment.label || "Unknown").split(" · ")[0];
        stats.set(label, (stats.get(label) || 0) + duration);
        total += duration;
    }

    return { stats, total };
}

function drawEmotionPieChart(segments) {
    if (!emotionPieChart) return;

    const context = emotionPieChart.getContext("2d");
    const width = emotionPieChart.width;
    const height = emotionPieChart.height;
    const radius = Math.min(width, height) / 2 - 8;
    const centerX = width / 2;
    const centerY = height / 2;
    const { stats, total } = getEmotionStats(segments);

    context.clearRect(0, 0, width, height);

    if (!total) {
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fillStyle = "#e8e8ed";
        context.fill();
        context.fillStyle = "#86868b";
        context.font = "700 13px -apple-system, BlinkMacSystemFont, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("No Data", centerX, centerY);
        return;
    }

    let startAngle = -Math.PI / 2;

    for (const [label, duration] of stats.entries()) {
        const angle = (duration / total) * Math.PI * 2;
        const endAngle = startAngle + angle;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle);
        context.closePath();
        context.fillStyle = getRecordColor(label);
        context.fill();

        startAngle = endAngle;
    }

    context.beginPath();
    context.arc(centerX, centerY, radius * 0.56, 0, Math.PI * 2);
    context.fillStyle = "#f5f5f7";
    context.fill();

    context.fillStyle = "#1d1d1f";
    context.font = "800 18px -apple-system, BlinkMacSystemFont, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(formatRecordTime(total), centerX, centerY - 4);

    context.fillStyle = "#86868b";
    context.font = "700 11px -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText("Total", centerX, centerY + 16);
}

function renderEmotionPieLegend(segments) {
    if (!emotionPieLegend) return;

    const { stats, total } = getEmotionStats(segments);

    if (!total) {
        emotionPieLegend.textContent = "暂无占比数据";
        return;
    }

    emotionPieLegend.innerHTML = [...stats.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, duration]) => {
            const percent = ((duration / total) * 100).toFixed(1);
            return `
                <div class="record-legend-item">
                    <span class="record-legend-label">
                        <span class="record-legend-dot" style="background:${getRecordColor(label)}"></span>
                        <span class="record-legend-name">${escapeHtml(label)}</span>
                    </span>
                    <span class="record-legend-value">${percent}%</span>
                </div>
            `;
        })
        .join("");
}

function updateRecordUI() {
    if (recordToggle) {
        recordToggle.textContent = isRecording ? "Stop Record" : "Record";
        recordToggle.classList.toggle("is-recording", isRecording);
    }

    if (recordStatus) {
        recordStatus.textContent = isRecording ? "Recording" : "Not Recording";
    }

    if (recordClear) {
        recordClear.disabled = isRecording || (!recordSegments.length && !activeRecordSegment);
    }

    const previewSegments = getRecordPreviewSegments();

    if (recordSummary) {
        if (!previewSegments.length) {
            recordSummary.textContent = isRecording
                ? "正在等待第一个有效表情状态。"
                : "点击 Record 后开始按时间记录表情变化。";
        } else {
            const labels = previewSegments.map((item) => item.label).join(" → ");
            recordSummary.textContent = `已记录：${labels}`;
        }
    }

    if (recordList) {
        recordList.innerHTML = previewSegments
            .map((item) => `
                <div class="record-item">
                    <strong>${formatRecordTime(item.start)} - ${formatRecordTime(item.end)} · ${escapeHtml(item.label)}</strong>
                    <span>${escapeHtml(item.note || "检测到状态变化后自动生成该时间段。")}</span>
                </div>
            `)
            .join("");
    }

    drawEmotionPieChart(previewSegments);
    renderEmotionPieLegend(previewSegments);
}

function resetRecordTimeline() {
    isRecording = false;
    recordStartedAt = 0;
    activeRecordSegment = null;
    recordSegments = [];
    updateRecordUI();
}

function toggleRecordTimeline() {
    if (!isRecording) {
        isRecording = true;
        recordStartedAt = performance.now();
        activeRecordSegment = null;
        recordSegments = [];
        updateRecordUI();
        return;
    }

    finalizeActiveRecordSegment();
    isRecording = false;
    updateRecordUI();
}

function recordEmotionState(state) {
    if (!isRecording) return;

    const label = getRecordLabel(state);
    if (!label) return;

    const now = performance.now();
    const relativeNow = now - recordStartedAt;

    if (!activeRecordSegment) {
        activeRecordSegment = {
            label,
            start: relativeNow,
            end: relativeNow,
            note: "记录开始后的第一个有效状态。"
        };
        updateRecordUI();
        return;
    }

    const activeLabel = String(activeRecordSegment.label).split(" · ")[0];

    if (activeLabel === label) {
        activeRecordSegment.end = relativeNow;
        updateRecordUI();
        return;
    }

    finalizeActiveRecordSegment(now);
    activeRecordSegment = {
        label,
        start: relativeNow,
        end: relativeNow,
        note: "检测到状态变化。"
    };
    updateRecordUI();
}

function ensureFaceOverlay() {
    if (faceOverlay) return faceOverlay;

    faceOverlay = document.querySelector("#faceOverlay");

    if (!faceOverlay && cameraPreview) {
        faceOverlay = document.createElement("canvas");
        faceOverlay.id = "faceOverlay";
        cameraPreview.appendChild(faceOverlay);
    }

    if (faceOverlay) {
        Object.assign(faceOverlay.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "2"
        });
    }

    if (cameraVideo) {
        Object.assign(cameraVideo.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            objectFit: "cover"
        });
    }

    return faceOverlay;
}

function setCameraRunning(isRunning) {
    cameraPreview?.classList.toggle("is-running", isRunning);
    cameraPreview?.classList.toggle("is-idle", !isRunning);

    if (cameraVideo) cameraVideo.hidden = !isRunning;
    if (cameraIdle) {
        cameraIdle.hidden = isRunning;
        cameraIdle.style.display = isRunning ? "none" : "flex";
    }
    if (cameraStart) cameraStart.disabled = isRunning || isModelLoading;
    if (cameraStop) cameraStop.disabled = !isRunning;
    if (recordToggle) recordToggle.disabled = !isRunning;
    if (analyzeFrameButton) {
        analyzeFrameButton.hidden = !isRemoteMode;
        analyzeFrameButton.disabled = !isRunning || isInferencing;
    }
}

function setCameraStatus({ state, desc, face, confidence, runtime } = {}) {
    if (state) setText(emotionState, state);
    if (desc) setText(emotionDesc, desc);
    if (face) setText(faceStatus, face);
    if (confidence) setText(emotionConfidence, confidence);
    if (runtime) setText(cameraRuntime, runtime);
    if (state) recordEmotionState(state);
}

function mapEmotionLabel(label = "") {
    const normalized = label.toLowerCase();

    if (normalized.includes("happy") || normalized.includes("surprise")) {
        return {
            state: "Positive",
            desc: "模型识别到积极或高唤醒表情特征。该结果仅代表表情倾向，不代表真实心理状态。"
        };
    }

    if (normalized.includes("neutral")) {
        return {
            state: "Neutral",
            desc: "模型识别到较平稳的中性表情特征。"
        };
    }

    if (
        normalized.includes("angry") ||
        normalized.includes("sad") ||
        normalized.includes("fear") ||
        normalized.includes("disgust")
    ) {
        return {
            state: "Negative",
            desc: "模型识别到负向或紧张类表情特征。该结果只能作为视觉推测。"
        };
    }

    return {
        state: label || "Unknown",
        desc: "模型已返回结果，但当前类别未映射到预设情绪分组。"
    };
}

async function loadEmotionModel() {
    if (emotionClassifier) return emotionClassifier;

    setCameraStatus({
        state: "Loading Emotion",
        desc: "正在加载浏览器端表情识别模型。",
        face: "Emotion Model",
        confidence: "-",
        runtime: "Transformers.js"
    });

    emotionClassifier = await pipeline("image-classification", EMOTION_MODEL_ID);
    return emotionClassifier;
}

async function loadYoloModel() {
    if (yoloSession) return yoloSession;

    setCameraStatus({
        state: "Loading YOLO",
        desc: "正在加载 YOLOv8-Face 人脸检测模型。",
        face: "YOLO Loading",
        confidence: "-",
        runtime: "ONNX Runtime Web"
    });

    yoloSession = await ort.InferenceSession.create(YOLO_MODEL_PATH, {
        executionProviders: ["wasm"]
    });

    return yoloSession;
}

async function loadModels() {
    if (isRemoteMode) return;

    isModelLoading = true;
    setCameraRunning(false);

    try {
        await Promise.all([loadEmotionModel(), loadYoloModel()]);
    } finally {
        isModelLoading = false;
    }
}

function normalizeRemoteEmotion(payload = {}) {
    const label = payload.emotion || payload.label || payload.state || payload.class || "Unknown";
    const score = Number(payload.confidence ?? payload.score ?? payload.probability ?? 0);
    const mapped = mapEmotionLabel(label);

    return {
        state: mapped.state,
        desc: payload.description || mapped.desc,
        label,
        confidence: Number.isFinite(score) && score > 0 ? `${(score * 100).toFixed(1)}%` : "-",
        face: payload.face || payload.faces || payload.face_count || "Remote",
        runtime: payload.runtime || payload.mode || "Remote API"
    };
}

async function postFrameToEndpoint(endpoint, blob) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REMOTE_TIMEOUT);
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`${endpoint} returned ${response.status}`);
        }

        return await response.json();
    } finally {
        window.clearTimeout(timeout);
    }
}

async function captureFrameBlob() {
    if (!cameraVideo || !cameraVideo.videoWidth || !cameraVideo.videoHeight) {
        return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", REMOTE_FRAME_QUALITY);
    });
}

function renderPreviewFallback(reason = "AI inference service is currently offline.") {
    setCameraStatus({
        state: "Preview Mode",
        desc: `摄像头预览可用，但远程推理暂不可用。${reason}`,
        face: "Preview Only",
        confidence: "-",
        runtime: "Mobile Browser"
    });
}

async function inferRemoteFrame() {
    if (isInferencing || !cameraStream) return;
    isInferencing = true;
    if (analyzeFrameButton) analyzeFrameButton.disabled = true;

    try {
        setCameraStatus({
            state: "Analyzing",
            desc: "正在上传当前画面到远程推理服务。",
            face: "Uploading",
            confidence: "-",
            runtime: "Remote API"
        });

        const blob = await captureFrameBlob();
        if (!blob) {
            renderPreviewFallback("当前视频帧尚未准备完成。");
            return;
        }

        try {
            const result = await postFrameToEndpoint(REMOTE_YOLO_ENDPOINT, blob);
            const normalized = normalizeRemoteEmotion(result);
            setCameraStatus({
                state: normalized.state,
                desc: `${normalized.desc} 原始类别：${normalized.label}。`,
                face: String(normalized.face),
                confidence: normalized.confidence,
                runtime: normalized.runtime || "YOLO Remote API"
            });
            return;
        } catch (error) {
            console.warn("Remote YOLO unavailable:", error);
        }

        try {
            const result = await postFrameToEndpoint(VISION_FALLBACK_ENDPOINT, blob);
            const normalized = normalizeRemoteEmotion(result);
            setCameraStatus({
                state: normalized.state,
                desc: `${normalized.desc} 当前为 Cloudflare Vision Demo fallback。原始类别：${normalized.label}。`,
                face: String(normalized.face),
                confidence: normalized.confidence,
                runtime: normalized.runtime || "Vision Demo"
            });
            return;
        } catch (error) {
            console.warn("Vision fallback unavailable:", error);
        }

        renderPreviewFallback("YOLO API 和 Vision fallback 均未返回有效结果。");
    } catch (error) {
        console.error("Remote emotion inference failed:", error);
        renderPreviewFallback("远程推理请求失败，请检查 API 路由或网络状态。");
    } finally {
        isInferencing = false;
        if (analyzeFrameButton) analyzeFrameButton.disabled = !cameraStream;
    }
}

function prepareYoloInput() {
    if (!cameraVideo || !cameraCanvas) return null;

    const videoWidth = cameraVideo.videoWidth;
    const videoHeight = cameraVideo.videoHeight;
    if (!videoWidth || !videoHeight) return null;

    const context = cameraCanvas.getContext("2d", { willReadFrequently: true });
    const scale = Math.min(YOLO_INPUT_SIZE / videoWidth, YOLO_INPUT_SIZE / videoHeight);
    const resizedWidth = Math.round(videoWidth * scale);
    const resizedHeight = Math.round(videoHeight * scale);
    const padX = Math.floor((YOLO_INPUT_SIZE - resizedWidth) / 2);
    const padY = Math.floor((YOLO_INPUT_SIZE - resizedHeight) / 2);

    cameraCanvas.width = YOLO_INPUT_SIZE;
    cameraCanvas.height = YOLO_INPUT_SIZE;

    context.fillStyle = "rgb(114,114,114)";
    context.fillRect(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);
    context.drawImage(cameraVideo, padX, padY, resizedWidth, resizedHeight);

    const imageData = context.getImageData(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE).data;
    const input = new Float32Array(3 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE);
    const planeSize = YOLO_INPUT_SIZE * YOLO_INPUT_SIZE;

    for (let i = 0; i < planeSize; i += 1) {
        input[i] = imageData[i * 4] / 255;
        input[i + planeSize] = imageData[i * 4 + 1] / 255;
        input[i + planeSize * 2] = imageData[i * 4 + 2] / 255;
    }

    return {
        tensor: new ort.Tensor("float32", input, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]),
        videoWidth,
        videoHeight,
        scale,
        padX,
        padY
    };
}

function getOutputRows(outputTensor) {
    const data = outputTensor.data;
    const dims = outputTensor.dims;

    if (dims.length !== 3) return [];

    if (dims[1] <= 20) {
        const channels = dims[1];
        const count = dims[2];
        const rows = [];

        for (let i = 0; i < count; i += 1) {
            const row = [];
            for (let c = 0; c < channels; c += 1) {
                row.push(data[c * count + i]);
            }
            rows.push(row);
        }

        return rows;
    }

    const count = dims[1];
    const channels = dims[2];
    const rows = [];

    for (let i = 0; i < count; i += 1) {
        const offset = i * channels;
        rows.push(Array.from(data.slice(offset, offset + channels)));
    }

    return rows;
}

function rowToFaceBox(row, meta) {
    const score = row[4];

    if (!Number.isFinite(score) || score < FACE_CONFIDENCE_THRESHOLD) return null;

    // Some YOLOv8-Face ONNX exports output xyxy instead of cxcywh.
    // This model uses x1, y1, x2, y2, confidence, landmarks...
    const [rawX1, rawY1, rawX2, rawY2] = row;

    const x1 = (rawX1 - meta.padX) / meta.scale;
    const y1 = (rawY1 - meta.padY) / meta.scale;
    const x2 = (rawX2 - meta.padX) / meta.scale;
    const y2 = (rawY2 - meta.padY) / meta.scale;

    const left = Math.max(0, Math.min(meta.videoWidth, Math.min(x1, x2)));
    const top = Math.max(0, Math.min(meta.videoHeight, Math.min(y1, y2)));
    const right = Math.max(0, Math.min(meta.videoWidth, Math.max(x1, x2)));
    const bottom = Math.max(0, Math.min(meta.videoHeight, Math.max(y1, y2)));

    if (right <= left || bottom <= top) return null;

    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
        score
    };
}

function getIoU(a, b) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    const y2 = Math.min(a.y + a.height, b.y + b.height);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;

    return intersection / (areaA + areaB - intersection || 1);
}

function nonMaxSuppression(boxes) {
    const sorted = [...boxes].sort((a, b) => b.score - a.score);
    const selected = [];

    while (sorted.length) {
        const current = sorted.shift();
        selected.push(current);

        for (let i = sorted.length - 1; i >= 0; i -= 1) {
            if (getIoU(current, sorted[i]) > FACE_IOU_THRESHOLD) {
                sorted.splice(i, 1);
            }
        }
    }

    return selected;
}

async function detectFaces() {
    const session = await loadYoloModel();
    const meta = prepareYoloInput();
    if (!meta) return [];

    const inputName = session.inputNames[0];
    const output = await session.run({ [inputName]: meta.tensor });
    const outputTensor = output[session.outputNames[0]];
    const rows = getOutputRows(outputTensor);

    const boxes = rows
        .map((row) => rowToFaceBox(row, meta))
        .filter(Boolean);

    return nonMaxSuppression(boxes);
}

function drawFaceOverlay(faces = []) {
    const overlay = ensureFaceOverlay();
    if (!overlay || !cameraVideo?.videoWidth || !cameraVideo?.videoHeight) return;

    const rect = cameraVideo.getBoundingClientRect();
    const width = Math.round(rect.width || cameraVideo.videoWidth);
    const height = Math.round(rect.height || cameraVideo.videoHeight);
    const dpr = window.devicePixelRatio || 1;

    overlay.width = Math.round(width * dpr);
    overlay.height = Math.round(height * dpr);
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;

    const context = overlay.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const scale = Math.max(width / cameraVideo.videoWidth, height / cameraVideo.videoHeight);
    const renderedWidth = cameraVideo.videoWidth * scale;
    const renderedHeight = cameraVideo.videoHeight * scale;
    const offsetX = (width - renderedWidth) / 2;
    const offsetY = (height - renderedHeight) / 2;

    for (const face of faces) {
        const x = offsetX + face.x * scale;
        const y = offsetY + face.y * scale;
        const boxWidth = face.width * scale;
        const boxHeight = face.height * scale;

        context.lineWidth = 2;
        //context.strokeStyle = "rgba(0, 122, 255, 0.95)";
        //context.fillStyle = "rgba(0, 122, 255, 0.14)";
        context.beginPath();
        context.roundRect(x, y, boxWidth, boxHeight, 14);
        context.fill();
        context.stroke();

        context.fillStyle = "rgba(0, 122, 255, 0.95)";
        context.font = "700 12px -apple-system, BlinkMacSystemFont, sans-serif";
        context.fillText(`${(face.score * 100).toFixed(1)}%`, x + 8, Math.max(16, y - 6));
    }
}

function clearOverlay() {
    const overlay = ensureFaceOverlay();
    if (!overlay) return;

    const context = overlay.getContext("2d");
    context.clearRect(0, 0, overlay.width, overlay.height);
}

function getLargestFace(faces) {
    return [...faces].sort((a, b) => (b.width * b.height) - (a.width * a.height))[0] || null;
}

function cropFaceAsDataUrl(face) {
    if (!face || !cameraVideo || !cameraCanvas) return null;

    const context = cameraCanvas.getContext("2d", { willReadFrequently: true });
    const padding = Math.round(Math.max(face.width, face.height) * 0.18);

    const x = Math.max(0, Math.round(face.x - padding));
    const y = Math.max(0, Math.round(face.y - padding));
    const width = Math.min(cameraVideo.videoWidth - x, Math.round(face.width + padding * 2));
    const height = Math.min(cameraVideo.videoHeight - y, Math.round(face.height + padding * 2));

    cameraCanvas.width = width;
    cameraCanvas.height = height;
    context.drawImage(cameraVideo, x, y, width, height, 0, 0, width, height);

    return cameraCanvas.toDataURL("image/jpeg", 0.86);
}

async function classifyFace(face) {
    const faceUrl = cropFaceAsDataUrl(face);
    if (!faceUrl) return null;

    const model = await loadEmotionModel();
    const results = await model(faceUrl, { topk: 1 });
    return results?.[0] || null;
}

async function inferCurrentFrame() {
    if (isInferencing || !cameraStream) return;
    isInferencing = true;

    try {
        const faces = await detectFaces();
        drawFaceOverlay();

        if (!faces.length) {
            setCameraStatus({
                state: "No Face",
                desc: "YOLO 当前没有检测到清晰人脸，请正对摄像头或提高光线。",
                face: "Not Found",
                confidence: "-",
                runtime: "YOLOv8-Face"
            });
            return;
        }

        const face = getLargestFace(faces);
        const emotion = await classifyFace(face);

        if (!emotion) {
            setCameraStatus({
                state: "Face Detected",
                desc: "已检测到人脸，但表情模型没有返回有效结果。",
                face: `${faces.length} Face`,
                confidence: `${(face.score * 100).toFixed(1)}%`,
                runtime: "YOLOv8-Face"
            });
            return;
        }

        const mapped = mapEmotionLabel(emotion.label);
        const confidence = `${(emotion.score * 100).toFixed(1)}%`;

        setCameraStatus({
            state: mapped.state,
            desc: `${mapped.desc} 原始类别：${emotion.label}。`,
            face: `${faces.length} Face`,
            confidence,
            runtime: "YOLO + Emotion"
        });
    } catch (error) {
        console.error("YOLO emotion inference failed:", error);
        setCameraStatus({
            state: "Inference Failed",
            desc: "YOLO 或表情模型推理失败，请检查模型文件名、路径和浏览器控制台。",
            face: "Error",
            confidence: "-",
            runtime: "ONNX Runtime Web"
        });
    } finally {
        isInferencing = false;
    }
}

function updateFps(timestamp) {
    frameCounter += 1;

    if (!lastFpsTime) {
        lastFpsTime = timestamp;
        return;
    }

    const elapsed = timestamp - lastFpsTime;
    if (elapsed < 1000) return;

    const fps = Math.round((frameCounter * 1000) / elapsed);
    setText(cameraFps, `${fps} fps`);

    frameCounter = 0;
    lastFpsTime = timestamp;
}

function analyzeCameraLoop(timestamp = 0) {
    if (!cameraStream) return;

    animationId = requestAnimationFrame(analyzeCameraLoop);
    updateFps(timestamp);

    if (timestamp - lastFrameTime < FRAME_INTERVAL) return;
    lastFrameTime = timestamp;

    inferCurrentFrame();
}

async function startCameraEmotion() {
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus({
            state: "Unsupported",
            desc: "当前浏览器不支持相机调用，请使用 Chrome、Edge 或 Safari。",
            face: "Unavailable",
            confidence: "-",
            runtime: "Browser"
        });
        return;
    }

    try {
        setText(emotionState, "Starting");
        setText(emotionDesc, "正在加载模型并请求摄像头权限。");
        setText(faceStatus, "Starting");
        setText(emotionConfidence, "-");
        setText(cameraFps, "-");

        isRemoteMode = resolveInferenceMode();
        await loadModels();

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        cameraVideo.srcObject = cameraStream;
        await cameraVideo.play();
        ensureFaceOverlay();

        lastFrameTime = 0;
        lastFpsTime = 0;
        frameCounter = 0;

        setCameraRunning(true);
        if (isRemoteMode) {
            setCameraStatus({
                state: "Preview Mode",
                desc: "移动端已启动摄像头。点击 Analyze Frame 上传单帧进行远程推理。",
                face: "Ready",
                confidence: "-",
                runtime: "Remote Inference"
            });
            setText(cameraFps, "manual");
        } else {
            setCameraStatus({
                state: "Analyzing",
                desc: "摄像头已启动，正在使用 YOLO 检测人脸并进行表情分类。",
                face: "Scanning",
                confidence: "-",
                runtime: "YOLO + Emotion"
            });

            animationId = requestAnimationFrame(analyzeCameraLoop);
        }
    } catch (error) {
        console.error("Camera start failed:", error);

        setCameraRunning(false);
        isModelLoading = false;
        setCameraStatus({
            state: "Start Failed",
            desc: isRemoteMode
                ? "启动失败。请确认浏览器已允许访问摄像头，且页面运行在 HTTPS 环境。"
                : "启动失败。请确认模型文件位于 models/yolov8m-face.onnx，并允许浏览器访问摄像头。",
            face: "Blocked",
            confidence: "-",
            runtime: "Browser"
        });
    }
}

function stopCameraEmotion() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;

    if (cameraVideo) {
        cameraVideo.pause();
        cameraVideo.srcObject = null;
    }

    clearOverlay();

    if (isRecording) {
        finalizeActiveRecordSegment();
        isRecording = false;
    }

    isInferencing = false;
    lastFrameTime = 0;
    lastFpsTime = 0;
    frameCounter = 0;

    setCameraRunning(false);
    setCameraStatus({
        state: "Waiting",
        desc: "启动相机后显示实时推测结果。",
        face: "Idle",
        confidence: "-",
        runtime: "Browser"
    });
    setText(cameraFps, "-");
}

cameraStart?.addEventListener("click", startCameraEmotion);
cameraStop?.addEventListener("click", stopCameraEmotion);
recordToggle?.addEventListener("click", toggleRecordTimeline);
recordClear?.addEventListener("click", resetRecordTimeline);
analyzeFrameButton?.addEventListener("click", inferRemoteFrame);
window.addEventListener("pagehide", stopCameraEmotion);

ensureFaceOverlay();
setCameraRunning(false);
if (analyzeFrameButton) analyzeFrameButton.hidden = true;
updateRecordUI();
