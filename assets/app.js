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
    image: ""
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
    image: ""
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
    image: ""
  }
];

let casesCache = [...seedCases];

function getConfig() {
  return window.SILK_WEB_CONFIG || {};
}

function getApiBaseUrl() {
  const { apiBaseUrl } = getConfig();
  return apiBaseUrl ? apiBaseUrl.replace(/\/$/, "") : "";
}

function getApiUrl(pathname) {
  return `${getApiBaseUrl()}${pathname}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toSafeText(value) {
  return String(value || "").trim();
}

function formatMultilineText(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function normalizeCase(item) {
  const description = toSafeText(item.description);
  const details = toSafeText(item.details);
  const resultFallback = toSafeText(item.result);

  return {
    ...item,
    metric: toSafeText(item.metric || resultFallback),
    description,
    challenge: toSafeText(item.challenge || description),
    solution: toSafeText(item.solution || details || description),
    outcome: toSafeText(item.outcome || resultFallback || details || description)
  };
}

async function apiRequest(pathname, options = {}) {
  const config = getConfig();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (config.adminApiKey) {
    headers["X-Admin-Key"] = config.adminApiKey;
  }

  const response = await fetch(getApiUrl(pathname), {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

async function fetchCases() {
  try {
    const response = await fetch(getApiUrl("/api/cases"));
    if (!response.ok) {
      throw new Error("Cases request failed");
    }

    const data = await response.json();
    const items = Array.isArray(data.cases) && data.cases.length ? data.cases : [...seedCases];
    casesCache = items.map(normalizeCase);
  } catch {
    casesCache = [...seedCases].map(normalizeCase);
  }

  return casesCache;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    reader.readAsDataURL(file);
  });
}

function renderCaseCards(items) {
  return items.map((item) => `
    <article class="case-card reveal visible">
      <div class="case-cover" style="${item.image ? `background-image: linear-gradient(135deg, rgba(15,163,199,0.16), rgba(63,136,255,0.14)), url('${escapeHtml(item.image)}')` : ""}"></div>
      <div class="case-card-top">
        <div class="case-meta">
          <span>${escapeHtml(item.category)}</span>
        </div>
        ${item.metric ? `<div class="case-metric">${escapeHtml(item.metric)}</div>` : ""}
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <button class="button button-secondary case-more" type="button" data-case-open="${escapeHtml(item.id)}">Подробнее</button>
    </article>
  `).join("");
}

function renderFeaturedCases(items) {
  return items.map((item) => `
    <article class="featured-case reveal visible">
      <div class="featured-case-visual" style="${item.image ? `background-image: linear-gradient(135deg, rgba(15,163,199,0.16), rgba(63,136,255,0.14)), url('${escapeHtml(item.image)}')` : ""}"></div>
      <div class="featured-case-body">
        <div class="featured-case-top">
          <div class="case-meta"><span>${escapeHtml(item.category)}</span></div>
          ${item.metric ? `<div class="case-metric">${escapeHtml(item.metric)}</div>` : ""}
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="featured-case-snippets">
          <article>
            <strong>Задача</strong>
            <span>${escapeHtml(item.challenge)}</span>
          </article>
          <article>
            <strong>Результат</strong>
            <span>${escapeHtml(item.outcome)}</span>
          </article>
        </div>
        <div class="featured-case-actions">
          <button class="button button-primary" type="button" data-case-open="${escapeHtml(item.id)}">Подробнее</button>
          <a class="button button-secondary" href="#lead-form" data-service="${escapeHtml(item.category)}">Хочу похожий результат</a>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCases(selector, limit = null) {
  const container = document.querySelector(selector);
  if (!container) return;

  const items = limit ? casesCache.slice(0, limit) : casesCache;
  container.innerHTML = renderCaseCards(items);
}

function renderFeatured(selector, limit = 2) {
  const container = document.querySelector(selector);
  if (!container) return;

  container.innerHTML = renderFeaturedCases(casesCache.slice(0, limit));
}

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("active");
    }
  });
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function setupMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const actions = document.querySelector(".header-actions");
  if (!toggle || !nav || !actions) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    actions.classList.toggle("open");
    nav.classList.toggle("open");
  });
}

function setServiceValue(service) {
  if (!service) return;

  document.querySelectorAll(".js-lead-form input[name='service']").forEach((input) => {
    input.value = service;
  });
}

function setupServicePrefill() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-service]");
    if (!trigger) return;
    setServiceValue(trigger.dataset.service);
  });
}

async function sendToTelegram(payload) {
  await apiRequest("/api/leads", {
    method: "POST",
    headers: {},
    body: JSON.stringify({
      ...payload,
      page: window.location.href
    })
  });
}

function isValidPhone(value) {
  const normalized = value.replace(/\D/g, "");
  return normalized.length === 11 && (normalized.startsWith("7") || normalized.startsWith("8"));
}

function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;

  if (!normalized) return "";
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (!normalized.startsWith("7")) normalized = `7${normalized.slice(0)}`;
  normalized = normalized.slice(0, 11);

  const country = normalized.slice(0, 1);
  const part1 = normalized.slice(1, 4);
  const part2 = normalized.slice(4, 7);
  const part3 = normalized.slice(7, 9);
  const part4 = normalized.slice(9, 11);

  let result = `+${country}`;
  if (part1) result += ` (${part1}`;
  if (part1.length === 3) result += ")";
  if (part2) result += ` ${part2}`;
  if (part3) result += ` ${part3}`;
  if (part4) result += ` ${part4}`;
  return result;
}

function setupLeadForms() {
  document.querySelectorAll(".js-lead-form").forEach((form) => {
    const status = form.querySelector(".js-form-status");
    const contactInput = form.querySelector("input[name='contact']");

    contactInput?.addEventListener("input", (event) => {
      event.target.value = formatPhoneInput(event.target.value);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      const submitButton = form.querySelector("button[type='submit']");

      if (!isValidPhone(payload.contact || "")) {
        if (status) status.textContent = "Введите телефон в формате +7 (777) 777 77 77.";
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (status) status.textContent = "Отправляем заявку...";

      try {
        await sendToTelegram(payload);
        form.reset();
        if (status) status.textContent = "Заявка успешно отправлена.";
      } catch (error) {
        if (status) status.textContent = `Не удалось отправить заявку: ${error.message}`;
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
}

function setupCaseModal() {
  const modal = document.querySelector(".case-modal");
  if (!modal) return;

  const modalImage = modal.querySelector(".js-case-modal-image");
  const modalCategory = modal.querySelector(".js-case-modal-category");
  const modalMetric = modal.querySelector(".js-case-modal-metric");
  const modalTitle = modal.querySelector(".js-case-modal-title");
  const modalDescription = modal.querySelector(".js-case-modal-description");
  const modalChallenge = modal.querySelector(".js-case-modal-challenge");
  const modalSolution = modal.querySelector(".js-case-modal-solution");
  const modalOutcome = modal.querySelector(".js-case-modal-outcome");

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  const openModal = (caseId) => {
    const item = casesCache.find((entry) => entry.id === caseId);
    if (!item) return;

    modalImage.style.backgroundImage = item.image
      ? `linear-gradient(135deg, rgba(15,163,199,0.16), rgba(63,136,255,0.14)), url('${item.image.replace(/'/g, "\\'")}')`
      : "";
    modalCategory.innerHTML = `<span>${escapeHtml(item.category)}</span>`;
    modalMetric.textContent = item.metric || "";
    modalMetric.hidden = !item.metric;
    modalTitle.textContent = item.title;
    modalDescription.textContent = item.description;
    modalChallenge.innerHTML = formatMultilineText(item.challenge);
    modalSolution.innerHTML = formatMultilineText(item.solution);
    modalOutcome.innerHTML = formatMultilineText(item.outcome);
    modal.hidden = false;
    document.body.classList.add("modal-open");
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-case-open]");
    if (trigger) {
      openModal(trigger.dataset.caseOpen);
      return;
    }

    if (event.target.closest("[data-case-close]")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
}

function setupAdmin() {
  const form = document.querySelector(".js-case-form");
  const list = document.querySelector(".js-admin-cases");
  const status = document.querySelector(".js-admin-status");
  const resetButton = document.querySelector(".js-reset-form");
  if (!form || !list) return;

  const draw = () => {
    list.innerHTML = casesCache.map((item) => `
      <article class="admin-case">
        <div class="case-card-top">
          <div class="case-meta"><span>${escapeHtml(item.category)}</span></div>
          ${item.metric ? `<div class="case-metric">${escapeHtml(item.metric)}</div>` : ""}
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <div class="admin-case-details">
          <strong>Задача:</strong> ${formatMultilineText(item.challenge)}<br>
          <strong>Что сделали:</strong> ${formatMultilineText(item.solution)}<br>
          <strong>Результат:</strong> ${formatMultilineText(item.outcome)}
        </div>
        <div class="admin-case-actions">
          <button class="button button-secondary" type="button" data-edit="${escapeHtml(item.id)}">Редактировать</button>
          <button class="button button-secondary" type="button" data-delete="${escapeHtml(item.id)}">Удалить</button>
        </div>
      </article>
    `).join("");
  };

  const resetForm = () => {
    form.reset();
    form.elements.id.value = "";
    if (status) status.textContent = "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      const file = form.elements.imageFile.files[0];
      let imageValue = payload.image;

      if (file) {
        imageValue = await readFileAsDataUrl(file);
      }

      const requestPayload = {
        title: payload.title,
        category: payload.category,
        metric: payload.metric,
        description: payload.description,
        challenge: payload.challenge,
        solution: payload.solution,
        outcome: payload.outcome,
        image: imageValue
      };

      if (payload.id) {
        await apiRequest(`/api/cases/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify(requestPayload)
        });
      } else {
        await apiRequest("/api/cases", {
          method: "POST",
          body: JSON.stringify(requestPayload)
        });
      }

      await fetchCases();
      draw();
      renderCases(".js-cases-grid");
      renderFeatured(".js-featured-cases");
      resetForm();
      if (status) status.textContent = "Кейс сохранён.";
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  });

  list.addEventListener("click", async (event) => {
    const editTrigger = event.target.closest("[data-edit]");
    const deleteTrigger = event.target.closest("[data-delete]");
    const editId = editTrigger?.dataset.edit;
    const deleteId = deleteTrigger?.dataset.delete;

    if (editId) {
      const item = casesCache.find((entry) => entry.id === editId);
      if (!item) return;
      form.elements.id.value = item.id;
      form.elements.title.value = item.title;
      form.elements.category.value = item.category;
      form.elements.metric.value = item.metric || "";
      form.elements.image.value = item.image;
      form.elements.description.value = item.description;
      form.elements.challenge.value = item.challenge || "";
      form.elements.solution.value = item.solution || "";
      form.elements.outcome.value = item.outcome || "";
      if (status) status.textContent = "Режим редактирования кейса.";
    }

    if (deleteId) {
      try {
        await apiRequest(`/api/cases/${deleteId}`, {
          method: "DELETE"
        });
        await fetchCases();
        draw();
        renderCases(".js-cases-grid");
        renderFeatured(".js-featured-cases");
        resetForm();
        if (status) status.textContent = "Кейс удалён.";
      } catch (error) {
        if (status) status.textContent = error.message;
      }
    }
  });

  resetButton?.addEventListener("click", resetForm);
  draw();
}

async function init() {
  setActiveNav();
  setupReveal();
  setupMenu();
  setupServicePrefill();
  setupLeadForms();
  await fetchCases();
  renderCases(".js-cases-grid");
  renderFeatured(".js-featured-cases");
  setupCaseModal();
  setupAdmin();
}

init();
