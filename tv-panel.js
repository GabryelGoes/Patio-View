// Configuração da API: por padrão tenta usar o mesmo domínio (/api).
// Para apontar para outro backend, defina window.PATIO_API_BASE = "https://seu-backend.com/api" antes de carregar este script.
const API_BASE =
  typeof window !== "undefined" && window.PATIO_API_BASE
    ? window.PATIO_API_BASE
    : "/api";

const clockEl = document.getElementById("clock");
const carsGridEl = document.getElementById("cars-grid");
const vehiclesCountEl = document.getElementById("vehicles-count");
const noticeTitleEl = document.getElementById("notice-title");
const noticeBodyEl = document.getElementById("notice-body");
const noticeIndexIndicatorEl = document.getElementById("notice-index-indicator");
const weeklyPanelEl = document.getElementById("weekly-goal-panel");
const weeklyWeekLabelEl = document.getElementById("weekly-week-label");
const weeklyCurrentEl = document.getElementById("weekly-current");
const weeklyTargetEl = document.getElementById("weekly-target");
const weeklyBarEl = document.getElementById("weekly-bar");
const dotsEl = document.getElementById("pagination-dots");

let vehicles = [];
let notices = [];
let weeklyGoal = null;
let currentNoticeIndex = 0;
let noticeIntervalId = null;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function updateClock() {
  if (!clockEl) return;
  const now = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  clockEl.textContent = now.toLocaleString("pt-BR", options);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json();
}

async function loadVehicles() {
  try {
    const url = `${API_BASE}/service-orders?status=active&orderType=vehicle`;
    const data = await fetchJSON(url);
    vehicles = Array.isArray(data) ? data : [];
    renderVehicles();
  } catch (err) {
    console.error("Falha ao carregar veículos para TV:", err);
    vehiclesCountEl.textContent = "Erro ao carregar veículos";
  }
}

function normalizeStage(status) {
  const s = String(status || "").toLowerCase();
  if (!s) return "Em atendimento";
  if (s.includes("diagn")) return "Diagnóstico";
  if (s.includes("orc")) return "Orçamento";
  if (s.includes("aprova")) return "Aguardando aprovação";
  if (s.includes("exec") || s.includes("serviço")) return "Execução";
  if (s.includes("garant")) return "Garantia";
  if (s.includes("final")) return "Finalizado";
  return status;
}

function firstTwoNames(name) {
  if (!name) return "";
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  return parts.join(" ");
}

function renderVehicles() {
  if (!carsGridEl) return;
  carsGridEl.innerHTML = "";
  if (!vehicles || vehicles.length === 0) {
    vehiclesCountEl.textContent = "Nenhum veículo em atendimento";
    const empty = document.createElement("div");
    empty.style.display = "flex";
    empty.style.alignItems = "center";
    empty.style.justifyContent = "center";
    empty.style.color = "var(--muted)";
    empty.style.fontSize = "14px";
    empty.textContent = "Nenhum veículo em atendimento no momento.";
    carsGridEl.appendChild(empty);
    return;
  }

  vehiclesCountEl.textContent =
    vehicles.length === 1
      ? "1 veículo na oficina"
      : `${vehicles.length} veículos na oficina`;

  const slice = vehicles.slice(0, 4);
  slice.forEach((v) => {
    const model =
      v.vehicle_model ||
      (v.customers && v.customers.name ? v.customers.name : "Veículo");
    const plate = (v.plate || "").toUpperCase() || "---";
    const customer = v.customer_name || (v.customers && v.customers.name) || "";
    const stage = normalizeStage(v.status);

    const card = document.createElement("div");
    card.className = "car-card";

    const header = document.createElement("div");
    header.className = "car-header";
    const modelEl = document.createElement("div");
    modelEl.className = "car-model";
    modelEl.textContent = model;
    const statusEl = document.createElement("div");
    statusEl.className = "car-status";
    statusEl.textContent = stage;
    header.appendChild(modelEl);
    header.appendChild(statusEl);

    const row1 = document.createElement("div");
    row1.className = "car-row";
    const custLabel = document.createElement("div");
    custLabel.className = "car-label";
    custLabel.textContent = "Cliente";
    const custValue = document.createElement("div");
    custValue.textContent = firstTwoNames(customer);
    row1.appendChild(custLabel);
    row1.appendChild(custValue);

    const row2 = document.createElement("div");
    row2.className = "car-row";
    const plateLabel = document.createElement("div");
    plateLabel.className = "car-label";
    plateLabel.textContent = "Placa";
    const plateValue = document.createElement("div");
    plateValue.className = "plate";
    plateValue.textContent = plate;
    row2.appendChild(plateLabel);
    row2.appendChild(plateValue);

    const stageBadge = document.createElement("div");
    stageBadge.className = "stage-badge";
    stageBadge.textContent = stage;

    card.appendChild(header);
    card.appendChild(row1);
    card.appendChild(row2);
    card.appendChild(stageBadge);
    carsGridEl.appendChild(card);
  });
}

async function loadNoticesAndGoal() {
  try {
    const [noticesData, goalData] = await Promise.all([
      fetch(`${API_BASE}/notices`)
        .then((r) => (r.status === 404 ? [] : r.json()))
        .catch(() => []),
      fetch(`${API_BASE}/weekly-goal`)
        .then((r) => (r.status === 404 ? null : r.json()))
        .catch(() => null),
    ]);

    notices = Array.isArray(noticesData)
      ? noticesData.filter((n) => n.active !== false)
      : [];
    weeklyGoal = goalData;

    currentNoticeIndex = 0;
    renderNotice();
    renderWeeklyGoal();
    renderDots();

    if (noticeIntervalId) clearInterval(noticeIntervalId);
    if (notices.length > 1) {
      noticeIntervalId = setInterval(() => {
        currentNoticeIndex = (currentNoticeIndex + 1) % notices.length;
        renderNotice();
        renderDots();
      }, 12000);
    }
  } catch (err) {
    console.error("Falha ao carregar avisos/meta semanal para TV:", err);
  }
}

function renderNotice() {
  if (!noticeTitleEl || !noticeBodyEl || !noticeIndexIndicatorEl) return;

  if (!notices || notices.length === 0) {
    noticeTitleEl.textContent = "Nenhum aviso cadastrado";
    noticeBodyEl.textContent =
      "Use o quadro de avisos no sistema principal para criar mensagens que serão exibidas aqui na TV.";
    noticeIndexIndicatorEl.textContent = "0 / 0";
    return;
  }

  const n = notices[currentNoticeIndex] || notices[0];
  noticeTitleEl.textContent = n.title || "Aviso";
  noticeBodyEl.textContent = n.body || "";
  noticeIndexIndicatorEl.textContent = `${currentNoticeIndex + 1} / ${
    notices.length
  }`;
}

function renderWeeklyGoal() {
  if (!weeklyPanelEl) return;

  if (!weeklyGoal) {
    weeklyTargetEl.textContent = "Definir no app";
    weeklyCurrentEl.textContent = currency.format(0);
    weeklyBarEl.style.width = "0%";
    weeklyWeekLabelEl.textContent = "";
    return;
  }

  const target = Number(weeklyGoal.targetAmount || 0);
  const current = Number(weeklyGoal.currentAmount || 0);
  weeklyCurrentEl.textContent = currency.format(current);
  weeklyTargetEl.textContent =
    target > 0 ? currency.format(target) : "Definir no app";

  if (weeklyGoal.weekStart) {
    weeklyWeekLabelEl.textContent = `semana de ${new Date(
      weeklyGoal.weekStart + "T00:00:00"
    ).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  } else {
    weeklyWeekLabelEl.textContent = "";
  }

  if (target <= 0) {
    weeklyBarEl.style.width = "0%";
  } else {
    const pct = Math.min(130, Math.max(0, (current / target) * 100));
    weeklyBarEl.style.width = `${pct}%`;
  }
}

function renderDots() {
  if (!dotsEl) return;
  const pages = Math.max(1, notices.length || 1);
  dotsEl.innerHTML = "";
  for (let i = 0; i < pages; i++) {
    const s = document.createElement("span");
    if (i === currentNoticeIndex) s.classList.add("active");
    dotsEl.appendChild(s);
  }
}

function start() {
  updateClock();
  setInterval(updateClock, 15000);

  loadVehicles();
  loadNoticesAndGoal();

  setInterval(loadVehicles, 30000);
  setInterval(loadNoticesAndGoal, 60000);
}

start();

