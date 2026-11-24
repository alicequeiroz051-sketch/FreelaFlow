'use strict';
/* FreelaFlow — JavaScript puro + LocalStorage */
const KEY = 'freelaflow:v1';
const PROJECT_STATUS = ['Planejamento', 'Em andamento', 'Concluído', 'Cancelado'];
const PROPOSAL_STATUS = ['Pendente', 'Aprovada', 'Recusada'];
const BADGE = { 'Planejamento': '', 'Em andamento': 'prog', 'Concluído': 'done', 'Cancelado': 'canc', 'Pendente': 'prog', 'Aprovada': 'done', 'Recusada': 'canc' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0);
const fmtDate = d => (d ? d.split('-').reverse().join('/') : '—');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => isoDate(new Date());
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
const badge = s => `<span class="badge ${BADGE[s] || ''}">${esc(s)}</span>`;
const rowBtns = (kind, o, label, withView = false) => {
  const id = esc(o.id), l = esc(label);
  return `<div class="row">${withView ? `<button class="btn ghost sm" data-act="view-${kind}" data-id="${id}" aria-label="Ver ${l}">Ver</button>` : ''}<button class="btn ghost sm" data-act="edit-${kind}" data-id="${id}" aria-label="Editar ${l}">Editar</button><button class="btn danger sm" data-act="del-${kind}" data-id="${id}" aria-label="Excluir ${l}">Excluir</button></div>`;
};
const demoTag = o => (o.demo ? '<span class="badge demo">exemplo</span>' : '');

/* ---------- Estado e persistência ---------- */
function seed() {
  const c1 = uid(), c2 = uid();
  return {
    settings: { name: '', contact: '' },
    clients: [
      { id: c1, name: 'Cliente Exemplo A', company: 'Empresa Exemplo', email: 'a@exemplo.com', phone: '', notes: 'Cadastro de demonstração.', demo: true },
      { id: c2, name: 'Cliente Exemplo B', company: '', email: 'b@exemplo.com', phone: '', notes: '', demo: true }
    ],
    projects: [
      { id: uid(), name: 'Site institucional (exemplo)', clientId: c1, value: 3500, deadline: addDays(20), status: 'Em andamento', demo: true },
      { id: uid(), name: 'Identidade visual (exemplo)', clientId: c2, value: 1800, deadline: addDays(-25), status: 'Concluído', demo: true }
    ],
    proposals: [
      { id: uid(), clientId: c2, title: 'Landing page (exemplo)', services: [{ desc: 'Design da página', value: 900 }, { desc: 'Desenvolvimento', value: 1400 }], validUntil: addDays(15), status: 'Pendente', demo: true }
    ],
    activity: [{ text: 'Dados de exemplo carregados', at: new Date().toISOString() }]
  };
}
/* Garante tipos válidos mesmo se o LocalStorage foi alterado ou corrompido. */
function sanitize(raw) {
  const text = (v, d = '') => (typeof v === 'string' ? v : d);
  const num = v => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : 0);
  const date = v => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : today());
  const arr = a => (Array.isArray(a) ? a.filter(x => x && typeof x === 'object' && typeof x.id === 'string') : []);
  const clients = arr(raw.clients).map(c => ({ id: c.id, name: text(c.name, 'Sem nome'), company: text(c.company), email: text(c.email), phone: text(c.phone), notes: text(c.notes), demo: c.demo === true }));
  const known = new Set(clients.map(c => c.id));
  return {
    settings: { name: text(raw.settings?.name), contact: text(raw.settings?.contact) },
    clients,
    projects: arr(raw.projects).filter(p => known.has(p.clientId)).map(p => ({ id: p.id, name: text(p.name, 'Sem nome'), clientId: p.clientId, value: num(p.value), deadline: date(p.deadline), status: PROJECT_STATUS.includes(p.status) ? p.status : 'Planejamento', demo: p.demo === true })),
    proposals: arr(raw.proposals).filter(p => known.has(p.clientId)).map(p => ({ id: p.id, clientId: p.clientId, title: text(p.title, 'Sem título'), validUntil: date(p.validUntil), status: PROPOSAL_STATUS.includes(p.status) ? p.status : 'Pendente', demo: p.demo === true,
      services: (Array.isArray(p.services) ? p.services : []).filter(x => x && typeof x.desc === 'string').map(x => ({ desc: x.desc, value: num(x.value) })) })),
    activity: (Array.isArray(raw.activity) ? raw.activity : []).filter(a => a && typeof a.text === 'string' && !isNaN(Date.parse(a.at))).slice(0, 8)
  };
}
function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.clients)) return sanitize(parsed);
  } catch (err) { console.warn('Dados salvos ilegíveis; usando dados de exemplo.', err); }
  return seed();
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (err) { console.error(err); toast('Não foi possível salvar no navegador.'); }
}
function log(text) { state.activity.unshift({ text, at: new Date().toISOString() }); state.activity = state.activity.slice(0, 8); }
const byId = (list, id) => list.find(x => x.id === id);
const clientName = id => byId(state.clients, id)?.name ?? 'Cliente removido';
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2600); }

/* ---------- Modal e formulários ---------- */
const modal = $('#modal');
function openModal(html) { $('#modalBody').innerHTML = html; if (!modal.open) modal.showModal(); }
function closeModal() { if (modal.open) modal.close(); }
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function openForm({ title, fields, values = {}, onSave }) {
  const inputs = fields.map(f => {
    const v = values[f.name] ?? '', id = 'f_' + f.name;
    let el;
    if (f.type === 'select') el = `<select id="${id}" name="${f.name}">${f.options.map(([val, label]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
    else if (f.type === 'textarea') el = `<textarea id="${id}" name="${f.name}" rows="4" maxlength="1000" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
    else el = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}" ${['number', 'date'].includes(f.type) ? '' : 'maxlength="120"'} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''}>`;
    return `<label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${el}<small class="err" id="e_${f.name}" role="alert"></small>`;
  }).join('');
  openModal(`<h2 id="modalTitle">${esc(title)}</h2><form id="entityForm" novalidate>${inputs}<div class="actions"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn">Salvar</button></div></form>`);
  $('#entityForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {}; let firstError = null;
    fields.forEach(f => {
      const raw = $(`[name="${f.name}"]`, e.target).value.trim();
      data[f.name] = raw;
      let msg = '';
      if (f.required && !raw) msg = 'Campo obrigatório.';
      else if (raw && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) msg = 'E-mail inválido.';
      else if (raw && f.type === 'number' && (isNaN(raw) || Number(raw) < (f.min ?? -Infinity))) msg = 'Informe um número válido.';
      else if (raw && f.validate) msg = f.validate(raw) || '';
      $('#e_' + f.name).textContent = msg;
      $(`[name="${f.name}"]`, e.target).setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg && !firstError) firstError = f.name;
    });
    if (firstError) { $(`[name="${firstError}"]`).focus(); return; }
    try { onSave(data); save(); closeModal(); renderCurrent(); toast('Salvo com sucesso.'); }
    catch (err) { console.error(err); toast('Erro ao salvar. Tente novamente.'); }
  });
  $('#entityForm input, #entityForm select, #entityForm textarea')?.focus();
}
function upsert(list, id, data) {
  const existing = id && byId(list, id);
  if (existing) { Object.assign(existing, data); delete existing.demo; }
  else list.push({ id: uid(), ...data });
}

/* ---------- Clientes ---------- */
const clientFields = [
  { name: 'name', label: 'Nome', required: true }, { name: 'company', label: 'Empresa' },
  { name: 'email', label: 'E-mail', type: 'email' }, { name: 'phone', label: 'Telefone', type: 'tel' },
  { name: 'notes', label: 'Observações', type: 'textarea' }
];
function renderClients() {
  const q = $('#clientSearch').value.trim().toLowerCase();
  const list = state.clients.filter(c => [c.name, c.company, c.email].join(' ').toLowerCase().includes(q));
  $('#clientsList').innerHTML = list.length ? `<div class="tablewrap"><table><thead><tr><th>Nome</th><th>Empresa</th><th>E-mail</th><th>Projetos</th><th>Ações</th></tr></thead><tbody>${list.map(c =>
    `<tr><td>${esc(c.name)}${demoTag(c)}</td><td>${esc(c.company) || '—'}</td><td>${esc(c.email) || '—'}</td><td>${state.projects.filter(p => p.clientId === c.id).length}</td>
    <td>${rowBtns('client', c, c.name, true)}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${state.clients.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</div>`;
}
function viewClient(id) {
  const c = byId(state.clients, id); if (!c) return;
  const projects = state.projects.filter(p => p.clientId === id), props = state.proposals.filter(p => p.clientId === id);
  openModal(`<h2 id="modalTitle">${esc(c.name)}</h2><p class="muted">${esc(c.company) || 'Sem empresa'} · ${esc(c.email) || 'sem e-mail'} · ${esc(c.phone) || 'sem telefone'}</p>
  ${c.notes ? `<p>${esc(c.notes)}</p>` : ''}<h3>Projetos</h3>${projects.length ? `<ul>${projects.map(p => `<li>${esc(p.name)} — ${money(p.value)} ${badge(p.status)}</li>`).join('')}</ul>` : '<p class="muted">Nenhum projeto.</p>'}
  <h3>Propostas</h3>${props.length ? `<ul>${props.map(p => `<li>${esc(p.title)} — ${money(proposalTotal(p))} ${badge(p.status)}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma proposta.</p>'}
  <div class="actions"><button class="btn ghost" data-act="close">Fechar</button></div>`);
}

/* ---------- Projetos ---------- */
function projectFields() {
  return [
    { name: 'name', label: 'Nome do projeto', required: true },
    { name: 'clientId', label: 'Cliente', type: 'select', options: state.clients.map(c => [c.id, c.name]) },
    { name: 'value', label: 'Valor (R$)', type: 'number', min: 0, step: '0.01', required: true },
    { name: 'deadline', label: 'Prazo', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: PROJECT_STATUS.map(s => [s, s]) }
  ];
}
function openProject(id) {
  if (!state.clients.length) return toast('Cadastre um cliente antes de criar um projeto.');
  const p = id && byId(state.projects, id);
  openForm({ title: p ? 'Editar projeto' : 'Novo projeto', fields: projectFields(), values: p || { status: 'Planejamento' },
    onSave: d => { upsert(state.projects, id, { ...d, value: Number(d.value) }); log(`${p ? 'Projeto atualizado' : 'Projeto criado'}: ${d.name}`); } });
}
function renderProjects() {
  const f = $('#projectFilter').value;
  const list = state.projects.filter(p => !f || p.status === f);
  $('#projectsList').innerHTML = list.length ? `<div class="tablewrap"><table><thead><tr><th>Projeto</th><th>Cliente</th><th>Valor</th><th>Prazo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${list.map(p =>
    `<tr><td>${esc(p.name)}${demoTag(p)}</td><td>${esc(clientName(p.clientId))}</td><td>${money(p.value)}</td><td>${fmtDate(p.deadline)}</td><td>${badge(p.status)}</td>
    <td>${rowBtns('project', p, p.name)}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">Nenhum projeto para este filtro.</div>';
}

/* ---------- Orçamento ---------- */
function calcBudget({ hours, rate, extra, margin }) {
  const labor = hours * rate, cost = labor + extra, profit = cost * margin / 100, price = cost + profit;
  return { labor, cost, profit, price, perHour: hours > 0 ? price / hours : 0 };
}
function readBudget() {
  const v = id => parseFloat($(id).value);
  const input = { hours: v('#b_hours'), rate: v('#b_rate'), extra: v('#b_extra') || 0, margin: v('#b_margin') || 0 };
  const valid = [input.hours, input.rate].every(n => Number.isFinite(n) && n >= 0) && input.extra >= 0 && input.margin >= 0;
  return valid ? { input, result: calcBudget(input) } : null;
}
function renderBudget() {
  const b = readBudget(), box = $('#budgetResult');
  if (!b) { box.innerHTML = '<p class="muted">Informe horas e valor da hora (números não negativos).</p>'; return; }
  const r = b.result;
  box.innerHTML = `<div class="result"><span class="muted">Preço final sugerido</span><div class="big">${money(r.price)}</div><dl>
    <div><dt>Mão de obra</dt><dd>${money(r.labor)}</dd></div><div><dt>Custos adicionais</dt><dd>${money(b.input.extra)}</dd></div>
    <div><dt>Lucro (${b.input.margin}%)</dt><dd>${money(r.profit)}</dd></div><div><dt>Valor efetivo por hora</dt><dd>${money(r.perHour)}</dd></div></dl>
    <div class="actions"><button class="btn" data-act="budget-to-proposal">Criar proposta com este valor</button></div></div>`;
}

/* ---------- Propostas ---------- */
const proposalTotal = p => p.services.reduce((s, x) => s + x.value, 0);
function parseMoney(txt) {
  let s = txt.replace(/R\$|\s/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // "1.500" = mil e quinhentos
  const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : NaN;
}
function parseServices(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const i = line.lastIndexOf('|');
    return i > 0 ? { desc: line.slice(0, i).trim(), value: parseMoney(line.slice(i + 1)) } : { desc: line, value: NaN };
  });
}
const inputMoney = n => n.toFixed(2).replace('.', ',');
const servicesToText = p => p.services.map(s => `${s.desc} | ${inputMoney(s.value)}`).join('\n');
function openProposal(id, prefill = {}) {
  if (!state.clients.length) return toast('Cadastre um cliente antes de criar uma proposta.');
  const p = id && byId(state.proposals, id);
  const fields = [
    { name: 'clientId', label: 'Cliente', type: 'select', options: state.clients.map(c => [c.id, c.name]) },
    { name: 'title', label: 'Título', required: true },
    { name: 'services', label: 'Serviços (um por linha: descrição | valor)', type: 'textarea', required: true, placeholder: 'Desenvolvimento do site | 2500',
      validate: t => parseServices(t).some(s => !s.desc || Number.isNaN(s.value)) ? 'Use o formato "descrição | valor" em cada linha.' : '' },
    { name: 'validUntil', label: 'Válida até', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: PROPOSAL_STATUS.map(s => [s, s]) }
  ];
  const values = p ? { ...p, services: servicesToText(p) } : { status: 'Pendente', validUntil: addDays(15), ...prefill };
  openForm({ title: p ? 'Editar proposta' : 'Nova proposta', fields, values,
    onSave: d => { upsert(state.proposals, id, { ...d, services: parseServices(d.services) }); log(`${p ? 'Proposta atualizada' : 'Proposta criada'}: ${d.title}`); if (current !== 'proposals') location.hash = 'proposals'; } });
}
function renderProposals() {
  $('#proposalsList').innerHTML = state.proposals.length ? `<div class="tablewrap"><table><thead><tr><th>Proposta</th><th>Cliente</th><th>Total</th><th>Validade</th><th>Status</th><th>Ações</th></tr></thead><tbody>${state.proposals.map(p => {
    const expired = p.status === 'Pendente' && p.validUntil < today();
    return `<tr><td>${esc(p.title)}${demoTag(p)}</td><td>${esc(clientName(p.clientId))}</td><td>${money(proposalTotal(p))}</td><td>${fmtDate(p.validUntil)}${expired ? ' <span class="badge canc">vencida</span>' : ''}</td><td>${badge(p.status)}</td>
    <td>${rowBtns('prop', p, p.title, true)}</td></tr>`;
  }).join('')}</tbody></table></div>` : '<div class="empty">Nenhuma proposta criada ainda.</div>';
}
function viewProposal(id) {
  const p = byId(state.proposals, id); if (!p) return;
  const { name, contact } = state.settings, c = byId(state.clients, p.clientId);
  openModal(`<div class="doc"><h2 id="modalTitle">Proposta comercial</h2><p class="muted">${esc(p.title)}</p>
  <p><strong>Cliente:</strong> ${esc(c ? c.name : 'Cliente removido')}${c?.company ? ' — ' + esc(c.company) : ''}<br><strong>Válida até:</strong> ${fmtDate(p.validUntil)} · ${badge(p.status)}</p>
  <table><thead><tr><th>Serviço</th><th>Valor</th></tr></thead><tbody>${p.services.map(s => `<tr><td>${esc(s.desc)}</td><td>${money(s.value)}</td></tr>`).join('')}</tbody></table>
  <p class="total">Total: ${money(proposalTotal(p))}</p>${name ? `<p class="muted">Emitida por ${esc(name)}${contact ? ' · ' + esc(contact) : ''}</p>` : ''}</div>
  <div class="actions no-print"><button class="btn ghost" data-act="close">Fechar</button><button class="btn" data-act="print">Imprimir</button></div>`);
}

/* ---------- Painel ---------- */
function monthlySeries() {
  const now = new Date(), out = [];
  for (let i = -3; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({ key: isoDate(d).slice(0, 7), label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), done: 0, open: 0 });
  }
  state.projects.forEach(p => {
    const m = out.find(x => x.key === p.deadline.slice(0, 7));
    if (!m || p.status === 'Cancelado') return;
    if (p.status === 'Concluído') m.done += p.value; else m.open += p.value;
  });
  return out;
}
function chartSvg() {
  const s = monthlySeries(), max = Math.max(1, ...s.map(m => m.done + m.open)), W = 600, H = 230, base = H - 28, top = 30, bw = 46;
  const gap = (W - 40 - bw * s.length) / (s.length - 1), compact = new Intl.NumberFormat('pt-BR', { notation: 'compact' });
  const bars = s.map((m, i) => {
    const x = 20 + i * (bw + gap), hd = m.done / max * (base - top), ho = m.open / max * (base - top), total = m.done + m.open;
    return `<rect x="${x}" y="${base - hd - ho}" width="${bw}" height="${ho}" rx="5" fill="#E6394655"/><rect x="${x}" y="${base - hd}" width="${bw}" height="${hd}" rx="5" fill="#E63946"/>
      <text x="${x + bw / 2}" y="${base - hd - ho - 6}">${total ? compact.format(total) : ''}</text><text x="${x + bw / 2}" y="${H - 8}">${esc(m.label)}</text>`;
  }).join('');
  const summary = s.map(m => `${m.label}: ${money(m.done + m.open)}`).join('; ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Faturamento mensal. ${esc(summary)}"><line x1="10" x2="${W - 10}" y1="${base}" y2="${base}" stroke="#2B303B"/>${bars}</svg>`;
}
function renderDashboard() {
  const forecast = state.projects.filter(p => ['Planejamento', 'Em andamento'].includes(p.status)).reduce((s, p) => s + p.value, 0);
  const stats = [['Clientes', state.clients.length], ['Projetos ativos', state.projects.filter(p => p.status === 'Em andamento').length],
    ['Propostas pendentes', state.proposals.filter(p => p.status === 'Pendente').length], ['Faturamento previsto', money(forecast)]];
  $('#stats').innerHTML = stats.map(([l, v]) => `<div class="stat"><span class="muted">${l}</span><b>${esc(v)}</b></div>`).join('');
  $('#greeting').textContent = state.settings.name ? `Olá, ${state.settings.name}. Aqui está o resumo do seu trabalho.` : 'Resumo do seu trabalho.';
  $('#chart').innerHTML = chartSvg();
  $('#activity').innerHTML = state.activity.length ? state.activity.map(a => `<li>${esc(a.text)}<time datetime="${esc(a.at)}">${new Date(a.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></li>`).join('') : '<li class="muted">Nenhuma atividade ainda.</li>';
}
function renderSettings() {
  const { name, contact } = state.settings;
  $('#profileInfo').textContent = name ? `${name}${contact ? ' · ' + contact : ''}` : 'Nenhum dado informado.';
}

/* ---------- Navegação e ações ---------- */
const VIEWS = { dashboard: renderDashboard, clients: renderClients, projects: renderProjects, budget: renderBudget, proposals: renderProposals, settings: renderSettings };
let current = 'dashboard';
function show(view) {
  current = VIEWS[view] ? view : 'dashboard';
  $$('.view').forEach(v => { v.hidden = v.id !== 'view-' + current; });
  $$('nav button').forEach(b => { if (b.dataset.id === current) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  renderCurrent();
}
function renderCurrent() {
  VIEWS[current]();
  // rótulos das colunas para o layout de cartões no celular
  $$('#main table').forEach(t => { const heads = $$('th', t).map(h => h.textContent); $$('tbody tr', t).forEach(r => $$('td', r).forEach((td, i) => { td.dataset.label = heads[i] || ''; })); });
}
function confirmDelete(msg, fn) { if (confirm(msg)) { fn(); save(); renderCurrent(); toast('Concluído.'); } }

const actions = {
  nav: id => { location.hash = id; },
  close: closeModal,
  print: () => window.print(),
    'export-data': () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `freelaflow-backup-${today()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast('Backup exportado com sucesso!');
  },
  
  'import-data': () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        const backup = JSON.parse(await file.text());
        const imported = backup.data ?? backup.state ?? backup;

        if (!imported || !Array.isArray(imported.clients)) {
          throw new Error('Formato inválido');
        }

        if (!confirm('Importar este backup? Os dados atuais serão substituídos.')) {
          return;
        }

        state = sanitize(imported);
        log('Backup importado com sucesso');
        save();
        renderCurrent();
        toast('Backup importado com sucesso!');
      } catch (error) {
        console.error(error);
        toast('Não foi possível importar este arquivo.');
      }
    });

    input.click();
  },

  'new-client': () => openForm({ title: 'Novo cliente', fields: clientFields, onSave: d => { upsert(state.clients, null, d); log(`Cliente cadastrado: ${d.name}`); } }),
  'edit-client': id => byId(state.clients, id) && openForm({ title: 'Editar cliente', fields: clientFields, values: byId(state.clients, id), onSave: d => { upsert(state.clients, id, d); log(`Cliente atualizado: ${d.name}`); } }),
  'view-client': viewClient,
  'del-client': id => {
    const c = byId(state.clients, id); if (!c) return;
    const np = state.projects.filter(p => p.clientId === id).length, nq = state.proposals.filter(p => p.clientId === id).length;
    confirmDelete(`Excluir "${c.name}"? Também serão removidos ${np} projeto(s) e ${nq} proposta(s) deste cliente.`, () => {
      state.clients = state.clients.filter(x => x.id !== id); state.projects = state.projects.filter(p => p.clientId !== id); state.proposals = state.proposals.filter(p => p.clientId !== id); log(`Cliente excluído: ${c.name}`);
    });
  },
  'new-project': () => openProject(null), 'edit-project': openProject,
  'del-project': id => confirmDelete('Excluir este projeto?', () => { log(`Projeto excluído: ${byId(state.projects, id)?.name ?? ''}`); state.projects = state.projects.filter(p => p.id !== id); }),
  'new-prop': () => openProposal(null), 'edit-prop': id => openProposal(id), 'view-prop': viewProposal,
  'del-prop': id => confirmDelete('Excluir esta proposta?', () => { log(`Proposta excluída: ${byId(state.proposals, id)?.title ?? ''}`); state.proposals = state.proposals.filter(p => p.id !== id); }),
  'budget-to-proposal': () => { const b = readBudget(); if (b) openProposal(null, { title: 'Proposta de serviços', services: `Serviços (${b.input.hours} h) | ${inputMoney(b.result.price)}` }); },
  'edit-settings': () => openForm({ title: 'Seus dados', values: state.settings, fields: [{ name: 'name', label: 'Nome' }, { name: 'contact', label: 'Contato (e-mail ou telefone)' }], onSave: d => { state.settings = d; } }),
  'remove-demo': () => confirmDelete('Remover todos os dados de exemplo?', () => {
    state.projects = state.projects.filter(p => !p.demo); state.proposals = state.proposals.filter(p => !p.demo);
    const inUse = id => state.projects.some(p => p.clientId === id) || state.proposals.some(p => p.clientId === id);
    state.clients = state.clients.filter(c => !c.demo || inUse(c.id)); // preserva exemplos que já têm dados seus
    state.clients.forEach(c => { if (c.demo && inUse(c.id)) delete c.demo; });
    log('Dados de exemplo removidos');
  }),
  'clear-all': () => confirmDelete('Apagar TODOS os dados deste navegador? Esta ação não pode ser desfeita.', () => { state = { settings: { name: '', contact: '' }, clients: [], projects: [], proposals: [], activity: [] }; })
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el) actions[el.dataset.act]?.(el.dataset.id); });
$('#clientSearch').addEventListener('input', renderCurrent);
$('#projectFilter').addEventListener('change', renderCurrent);
$('#budgetForm').addEventListener('input', renderBudget);
$('#budgetForm').addEventListener('submit', e => e.preventDefault());
$('.skip').addEventListener('click', e => { e.preventDefault(); $('#main').focus(); });
window.addEventListener('storage', e => { if (e.key === KEY) { state = load(); renderCurrent(); } });
window.addEventListener('hashchange', () => show(location.hash.slice(1)));
save();
show(location.hash.slice(1));
