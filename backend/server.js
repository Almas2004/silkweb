const http = require("http");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = ROOT_DIR;
const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const CASES_FILE = path.join(DATA_DIR, "cases.json");
const PORT = Number(process.env.PORT || 3000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "silkweb-admin-key";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8063620645:AAGsPhxrxl01vDYXlZ6tR8ELJ__cJDwwP4Q";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "1321982385";

const seedCases = [
  {
    id: "seed-1",
    title: "Корпоративный сайт для производственной компании",
    category: "Website",
    metric: "+41% заявок",
    description: "Пересобрали структуру сайта, усилили офферы, добавили формы захвата и SEO-архитектуру для роста входящих обращений.",
    challenge: "Компаниям было сложно быстро понять, чем именно занимается бизнес и как оставить заявку без лишних шагов.",
    solution: "Перестроили структуру, вывели ключевые направления на первый экран, усилили офферы и добавили понятные точки входа для обращения.",
    outcome: "Сайт стал рабочим инструментом продаж: менеджеры начали получать более понятные обращения, а входящий поток стал стабильнее.",
    image: "",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-2",
    title: "CRM для отдела продаж",
    category: "CRM",
    metric: "-28% потерь лидов",
    description: "Настроили стадии сделок, контроль менеджеров, учёт задач и удобную обработку заявок из digital-каналов.",
    challenge: "Лиды терялись между менеджерами, этапы воронки вели вручную, а по задачам и статусам не было единой картины.",
    solution: "Собрали прозрачную воронку, распределили зоны ответственности, привязали задачи к этапам и упорядочили входящие заявки.",
    outcome: "Команда получила контроль над процессом продаж, меньше ручной путаницы и более понятную работу с каждым обращением.",
    image: "",
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-3",
    title: "Telegram-бот для первичной квалификации",
    category: "Telegram Bot",
    metric: "24/7 обработка",
    description: "Автоматизировали ответы, сбор контактов и передачу лида в продажу без потери скорости реакции.",
    challenge: "Компания теряла часть тёплых лидов вне рабочего времени и тратила ресурс менеджеров на однотипные первые ответы.",
    solution: "Бот взял на себя первичный контакт, сбор базовых данных и быструю передачу запроса менеджеру.",
    outcome: "Скорость реакции выросла, а заинтересованных пользователей стало проще доводить до живого диалога с отделом продаж.",
    image: "",
    createdAt: new Date().toISOString()
  }
];

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });

  try {
    await fsp.access(CASES_FILE);
  } catch {
    await fsp.writeFile(CASES_FILE, JSON.stringify(seedCases, null, 2), "utf8");
  }
}

function normalizeCaseRecord(item) {
  const description = String(item.description || "").trim();
  const details = String(item.details || "").trim();
  const legacyResult = String(item.result || "").trim();

  return {
    ...item,
    metric: String(item.metric || legacyResult || "").trim(),
    description,
    challenge: String(item.challenge || description).trim(),
    solution: String(item.solution || details || description).trim(),
    outcome: String(item.outcome || legacyResult || details || description).trim()
  };
}

async function readCases() {
  try {
    const raw = await fsp.readFile(CASES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) && parsed.length ? parsed : seedCases;
    return items.map(normalizeCaseRecord);
  } catch {
    return seedCases.map(normalizeCaseRecord);
  }
}

async function writeCases(cases) {
  await fsp.writeFile(CASES_FILE, JSON.stringify(cases, null, 2), "utf8");
}

function isValidPhone(value) {
  const normalized = String(value || "").replace(/\D/g, "");
  return normalized.length === 11 && (normalized.startsWith("7") || normalized.startsWith("8"));
}

async function sendTelegramLead(payload) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram is not configured");
  }

  const text = [
    "Новая заявка с сайта Silk Web",
    `Имя: ${payload.name || "-"}`,
    `Телефон: ${payload.contact}`,
    `Услуга: ${payload.service || "-"}`,
    `Комментарий: ${payload.message || "-"}`,
    `Страница: ${payload.page || "-"}`
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text
    })
  });

  if (!response.ok) {
    throw new Error("Telegram request failed");
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Cache-Control": "no-store"
  });
  res.end();
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon"
  };

  return map[ext] || "application/octet-stream";
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function sanitizeCase(input) {
  const description = String(input.description || "").trim();
  return {
    id: input.id || crypto.randomUUID(),
    title: String(input.title || "").trim(),
    category: String(input.category || "").trim(),
    metric: String(input.metric || "").trim(),
    description,
    challenge: String(input.challenge || description).trim(),
    solution: String(input.solution || description).trim(),
    outcome: String(input.outcome || description).trim(),
    image: String(input.image || "").trim(),
    createdAt: input.createdAt || new Date().toISOString()
  };
}

function validateCasePayload(input) {
  if (!input.title || !input.category || !input.description) {
    return "Заполните название, категорию и описание кейса.";
  }

  return null;
}

async function storeImageFromDataUrl(imageValue) {
  if (!imageValue.startsWith("data:image/")) return imageValue;

  const match = imageValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Некорректный формат изображения.");
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extensionMap = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif"
  };
  const extension = extensionMap[mimeType] || ".png";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(UPLOADS_DIR, fileName);

  await fsp.writeFile(targetPath, Buffer.from(base64Data, "base64"));
  return `/uploads/${fileName}`;
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return true;
  }

  if (url.pathname === "/api/cases" && req.method === "GET") {
    const cases = await readCases();
    sendJson(res, 200, { cases });
    return true;
  }

  if (url.pathname === "/api/leads" && req.method === "POST") {
    const payload = await parseRequestBody(req);
    if (!payload.name || !payload.service || !isValidPhone(payload.contact)) {
      sendJson(res, 400, { error: "Проверьте имя, услугу и телефон." });
      return true;
    }

    await sendTelegramLead(payload);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (url.pathname.startsWith("/api/cases")) {
    const isAuthorized = req.headers["x-admin-key"] === ADMIN_API_KEY;
    if (!isAuthorized) {
      sendJson(res, 401, { error: "Unauthorized" });
      return true;
    }
  }

  if (url.pathname === "/api/cases" && req.method === "POST") {
    const payload = await parseRequestBody(req);
    const error = validateCasePayload(payload);
    if (error) {
      sendJson(res, 400, { error });
      return true;
    }

    const cases = await readCases();
    const sanitized = sanitizeCase(payload);
    sanitized.image = await storeImageFromDataUrl(sanitized.image);
    cases.unshift(sanitized);
    await writeCases(cases);
    sendJson(res, 201, { case: sanitized });
    return true;
  }

  const caseIdMatch = url.pathname.match(/^\/api\/cases\/([^/]+)$/);

  if (caseIdMatch && req.method === "PUT") {
    const caseId = decodeURIComponent(caseIdMatch[1]);
    const payload = await parseRequestBody(req);
    const error = validateCasePayload(payload);
    if (error) {
      sendJson(res, 400, { error });
      return true;
    }

    const cases = await readCases();
    const index = cases.findIndex((item) => item.id === caseId);
    if (index < 0) {
      sendJson(res, 404, { error: "Case not found" });
      return true;
    }

    const nextCase = sanitizeCase({ ...cases[index], ...payload, id: caseId });
    nextCase.image = await storeImageFromDataUrl(nextCase.image);
    cases[index] = nextCase;
    await writeCases(cases);
    sendJson(res, 200, { case: nextCase });
    return true;
  }

  if (caseIdMatch && req.method === "DELETE") {
    const caseId = decodeURIComponent(caseIdMatch[1]);
    const cases = await readCases();
    const nextCases = cases.filter((item) => item.id !== caseId);
    await writeCases(nextCases.length ? nextCases : seedCases);
    sendNoContent(res);
    return true;
  }

  return false;
}

async function serveStatic(req, res, url) {
  let targetPath = path.join(PUBLIC_DIR, decodeURIComponent(url.pathname));
  if (url.pathname === "/") {
    targetPath = path.join(PUBLIC_DIR, "index.html");
  }

  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const stats = await fsp.stat(resolved);
    if (stats.isDirectory()) {
      const indexPath = path.join(resolved, "index.html");
      const content = await fsp.readFile(indexPath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(content);
      return;
    }

    const content = await fsp.readFile(resolved);
    res.writeHead(200, {
      "Content-Type": getContentType(resolved),
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end("Not found");
  }
}

async function main() {
  await ensureStorage();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const handled = await handleApi(req, res, url);
      if (handled) return;
      await serveStatic(req, res, url);
    } catch (error) {
      sendJson(res, 500, { error: error.message || "Internal server error" });
    }
  });

  server.listen(PORT, () => {
    console.log(`Silk Web server is running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
