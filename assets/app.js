const seedCases = [
  {
    id: "seed-1",
    title: "Корпоративный сайт для производственной компании",
    category: "Website",
    description: "Пересобрали структуру сайта, усилили офферы, добавили формы захвата и SEO-архитектуру для роста входящих обращений.",
    image: ""
  },
  {
    id: "seed-2",
    title: "CRM для отдела продаж",
    category: "CRM",
    description: "Настроили стадии сделок, контроль менеджеров, учёт задач и удобную обработку заявок из digital-каналов.",
    image: ""
  },
  {
    id: "seed-3",
    title: "Telegram-бот для первичной квалификации",
    category: "Telegram Bot",
    description: "Автоматизировали ответы, сбор контактов и передачу лида в продажу без потери скорости реакции.",
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
    casesCache = Array.isArray(data.cases) && data.cases.length ? data.cases : [...seedCases];
  } catch {
    casesCache = [...seedCases];
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
      <div class="case-cover" style="${item.image ? `background-image: linear-gradient(135deg, rgba(15,163,199,0.16), rgba(63,136,255,0.14)), url('${item.image}')` : ""}"></div>
      <div class="case-meta">
        <span>${item.category}</span>
      </div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </article>
  `).join("");
}

function renderCases(selector, limit = null) {
  const container = document.querySelector(selector);
  if (!container) return;

  const items = limit ? casesCache.slice(0, limit) : casesCache;
  container.innerHTML = renderCaseCards(items);
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
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
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

function setupAdmin() {
  const form = document.querySelector(".js-case-form");
  const list = document.querySelector(".js-admin-cases");
  const status = document.querySelector(".js-admin-status");
  const resetButton = document.querySelector(".js-reset-form");
  if (!form || !list) return;

  const draw = () => {
    list.innerHTML = casesCache.map((item) => `
      <article class="admin-case">
        <div class="case-meta">
          <span>${item.category}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="admin-case-actions">
          <button class="button button-secondary" type="button" data-edit="${item.id}">Редактировать</button>
          <button class="button button-secondary" type="button" data-delete="${item.id}">Удалить</button>
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
        description: payload.description,
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
      renderCases(".js-cases-preview", 3);
      renderCases(".js-cases-grid");
      resetForm();
      if (status) status.textContent = "Кейс сохранён.";
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  });

  list.addEventListener("click", async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    if (editId) {
      const item = casesCache.find((entry) => entry.id === editId);
      if (!item) return;
      form.elements.id.value = item.id;
      form.elements.title.value = item.title;
      form.elements.category.value = item.category;
      form.elements.image.value = item.image;
      form.elements.description.value = item.description;
      if (status) status.textContent = "Режим редактирования кейса.";
    }

    if (deleteId) {
      try {
        await apiRequest(`/api/cases/${deleteId}`, {
          method: "DELETE"
        });
        await fetchCases();
        draw();
        renderCases(".js-cases-preview", 3);
        renderCases(".js-cases-grid");
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
  setupLeadForms();
  await fetchCases();
  renderCases(".js-cases-preview", 3);
  renderCases(".js-cases-grid");
  setupAdmin();
}

init();
