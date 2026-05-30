#!/usr/bin/env node

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { cpus } from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const port = Number.parseInt(process.env.AGENT_STATUS_PORT || "8788", 10);
const host = process.env.AGENT_STATUS_HOST || "127.0.0.1";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
};

const listCodexProcesses = async () => {
  try {
    const { stdout } = await execFileAsync("ps", ["-axo", "pid=,pcpu=,rss=,comm=,args="], { timeout: 1200 });
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => /\bcodex\b/i.test(line))
      .filter((line) => !line.includes("agent-status-bridge.mjs"))
      .map((line) => {
        const match = line.match(/^(\d+)\s+([\d.]+)\s+(\d+)/);
        return match
          ? {
              pid: match[1],
              cpu: Number.parseFloat(match[2]) || 0,
              memoryKb: Number.parseInt(match[3], 10) || 0,
            }
          : null;
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

const buildStatus = async () => {
  const processes = await listCodexProcesses();
  const processCount = processes.length;
  const hasCodexProcess = processCount > 0;
  const activeProcessCount = processes.filter((processInfo) => processInfo.cpu >= 1).length;
  const cpuCoreCount = Math.max(cpus().length, 1);
  const cpuRawPercent = processes.reduce((total, processInfo) => total + processInfo.cpu, 0);
  const cpuPercent = Math.min(cpuRawPercent / cpuCoreCount, 100);
  const memoryMb = processes.reduce((total, processInfo) => total + processInfo.memoryKb, 0) / 1024;
  const activityState = hasCodexProcess && activeProcessCount > 0 ? "running" : "idle";

  return {
    available: true,
    kind: "agent-bridge",
    activityState,
    title: hasCodexProcess ? "本机 Codex Agent 已连接" : "本机 Agent 状态桥已运行",
    source: `Local bridge :${port}`,
    state: hasCodexProcess
      ? `${activityState === "running" ? "Running" : "Idle"} · 检测到 ${processCount} 个 Codex 进程`
      : "Idle · 状态桥在线",
    status: activityState === "running" ? "Running" : "Idle",
    capability: hasCodexProcess ? "本机 Agent 状态读取" : "本机状态桥接",
    modelProvider: hasCodexProcess ? "OpenAI Codex（精确模型未由本机状态桥暴露）" : "状态桥未识别到具体模型",
    summary: hasCodexProcess
      ? `状态桥已连接，并检测到本机 Codex 相关进程；当前推断为 ${activityState === "running" ? "Running" : "Idle"}。`
      : "状态桥已启动，但暂未从进程列表中识别到 Codex；网页仍可确认桥接服务在线。",
    checkedAt: new Date().toISOString(),
    processCount,
    activeProcessCount,
    cpuPercent: Number(cpuPercent.toFixed(1)),
    cpuRawPercent: Number(cpuRawPercent.toFixed(1)),
    cpuCoreCount,
    memoryMb: Number(memoryMb.toFixed(1)),
    refreshMs: 1000,
  };
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

  if (request.method !== "GET" || url.pathname !== "/agent-status") {
    sendJson(response, 404, { available: false, error: "Not found" });
    return;
  }

  sendJson(response, 200, await buildStatus());
});

server.listen(port, host, () => {
  console.log(`Agent status bridge listening at http://${host}:${port}/agent-status`);
});
