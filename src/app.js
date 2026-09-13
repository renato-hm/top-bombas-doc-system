// ===================================================================
// Top Bombas — Consulta de Notas Fiscais
// ===================================================================

let records = [
  { nf: "NF-2026-00481", company: "Bosch",              date: "10/09/2026", value: "R$ 3.420,00", items: "Bomba centrífuga 2\" + kit de vedação",              status: "pendente", signedAt: null, gps: null },
  { nf: "NF-2026-00479", company: "Hidromar",            date: "08/09/2026", value: "R$ 8.150,00", items: "Bomba submersível industrial",                        status: "entregue", signedAt: "08/09/2026 14:32", gps: "-25.4284, -49.2733" },
  { nf: "NF-2026-00476", company: "Plaenge",             date: "05/09/2026", value: "R$ 1.190,00", items: "Manutenção preventiva + peças de reposição",          status: "entregue", signedAt: "05/09/2026 09:15", gps: "-25.4372, -49.2691" },
  { nf: "NF-2026-00472", company: "Patrão",              date: "02/09/2026", value: "R$ 640,00",   items: "Serviço de manutenção corretiva",                     status: "entregue", signedAt: "02/09/2026 16:48", gps: "-25.4284, -49.2733" },
  { nf: "NF-2026-00468", company: "Lavrasul",            date: "29/08/2026", value: "R$ 5.980,00", items: "Bomba de recalque + instalação",                      status: "pendente", signedAt: null, gps: null },
  { nf: "NF-2026-00465", company: "Novacki",             date: "27/08/2026", value: "R$ 2.310,00", items: "Kit de vedação + revisão de motor",                   status: "pendente", signedAt: null, gps: null },
];

const listView = document.getElementById("listView");
const docView = document.getElementById("docView");
const listEl = document.getElementById("recordList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterRow = document.getElementById("filterRow");
const resultCount = document.getElementById("resultCount");
const summaryRow = document.getElementById("summaryRow");

let currentNf = null;
let hasSignature = false;
let currentGps = null;
let activeFilter = "todas";

// ---------- Resumo ----------

function renderSummary() {
  const pendentes = records.filter(r => r.status === "pendente").length;
  const entregues = records.filter(r => r.status === "entregue").length;

  summaryRow.innerHTML = `
    <div class="summary-card">
      <span class="num">${records.length}</span>
      <span class="label">Notas no total</span>
    </div>
    <div class="summary-card pendente">
      <span class="num">${pendentes}</span>
      <span class="label">Pendentes</span>
    </div>
    <div class="summary-card entregue">
      <span class="num">${entregues}</span>
      <span class="label">Entregues</span>
    </div>
  `;
}

// ---------- Tela de lista ----------

function parseValue(v) {
  return parseFloat(v.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
}

function parseDate(d) {
  const [day, month, year] = d.split("/");
  return new Date(`${year}-${month}-${day}`);
}

function renderList() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = records.filter(r => r.company.toLowerCase().includes(query));

  if (activeFilter !== "todas") {
    filtered = filtered.filter(r => r.status === activeFilter);
  }

  const sortMode = sortSelect.value;
  filtered = [...filtered].sort((a, b) => {
    if (sortMode === "date-desc") return parseDate(b.date) - parseDate(a.date);
    if (sortMode === "date-asc") return parseDate(a.date) - parseDate(b.date);
    if (sortMode === "value-desc") return parseValue(b.value) - parseValue(a.value);
    if (sortMode === "value-asc") return parseValue(a.value) - parseValue(b.value);
    return 0;
  });

  resultCount.textContent = query
    ? `${filtered.length} resultado(s) para "${searchInput.value.trim()}"`
    : `${filtered.length} nota(s) fiscal(is) exibida(s)`;

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-mark"></div>
        Nenhuma nota fiscal encontrada.
      </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(r => `
    <div class="record" data-status="${r.status}" data-nf="${r.nf}">
      <div class="record-info">
        <span class="record-nf">${r.nf}</span>
        <span class="record-company">${r.company}</span>
        <span class="record-date">${r.date} · ${r.value}</span>
      </div>
      <div class="record-right">
        <span class="status-badge ${r.status}">${r.status}</span>
        <span class="chevron">›</span>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".record").forEach(el => {
    el.addEventListener("click", () => openDocument(el.dataset.nf));
  });
}

searchInput.addEventListener("input", renderList);
sortSelect.addEventListener("change", renderList);

filterRow.addEventListener("click", e => {
  const chip = e.target.closest(".filter-chip");
  if (!chip) return;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  activeFilter = chip.dataset.filter;
  renderList();
});

// ---------- Tela do documento ----------

function openDocument(nf) {
  currentNf = nf;
  const r = records.find(x => x.nf === nf);
  hasSignature = false;
  currentGps = null;

  document.getElementById("docNf").textContent = r.nf;
  document.getElementById("docCompany").textContent = r.company;
  document.getElementById("docDate").textContent = r.date;
  document.getElementById("docValue").textContent = r.value;
  document.getElementById("docItems").textContent = r.items;

  const statusEl = document.getElementById("docStatus");
  statusEl.textContent = r.status;
  statusEl.className = `doc-status ${r.status}`;

  const signSection = document.getElementById("signSection");
  const confirmedStamp = document.getElementById("confirmedStamp");

  if (r.status === "entregue") {
    signSection.style.display = "none";
    confirmedStamp.style.display = "flex";
    confirmedStamp.innerHTML = `
      <span class="gps-dot"></span>
      <span>Entrega confirmada em <strong>${r.signedAt}</strong> · localização <strong>${r.gps}</strong></span>
    `;
  } else {
    signSection.style.display = "block";
    confirmedStamp.style.display = "none";
    setTimeout(setupCanvas, 0);
    captureGps();
  }

  listView.classList.remove("active");
  docView.classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.getElementById("backBtn").addEventListener("click", () => {
  docView.classList.remove("active");
  listView.classList.add("active");
  renderList();
});

document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

// ---------- Canvas de assinatura ----------

const canvas = document.getElementById("sigCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

function setupCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.strokeStyle = "#1C3C57";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  hasSignature = false;
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  return { x: point.clientX - rect.left, y: point.clientY - rect.top };
}

canvas.addEventListener("pointerdown", e => {
  drawing = true;
  hasSignature = true;
  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
});
canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
});
window.addEventListener("pointerup", () => drawing = false);

document.getElementById("clearSig").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasSignature = false;
});

// ---------- GPS (simulado) ----------

function captureGps() {
  const gpsText = document.getElementById("gpsText");
  gpsText.textContent = "Obtendo localização…";
  setTimeout(() => {
    const lat = (-25.40 - Math.random() * 0.08).toFixed(4);
    const lng = (-49.25 - Math.random() * 0.06).toFixed(4);
    currentGps = `${lat}, ${lng}`;
    gpsText.textContent = `Localização capturada: ${currentGps}`;
  }, 900);
}

// ---------- Confirmar entrega ----------

document.getElementById("confirmSign").addEventListener("click", () => {
  const gpsText = document.getElementById("gpsText");
  if (!hasSignature) {
    gpsText.textContent = "Assine no campo acima antes de confirmar.";
    gpsText.style.color = "var(--red)";
    return;
  }
  const record = records.find(r => r.nf === currentNf);
  const now = new Date();
  record.status = "entregue";
  record.signedAt = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  record.gps = currentGps || "—";

  renderSummary();
  openDocument(currentNf);
});

// ---------- Início ----------

renderSummary();
renderList();
