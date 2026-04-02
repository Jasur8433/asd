const STORAGE_KEY = 'kpi_digital_university_v2';

const appState = {
  users: [],
  kpis: [],
  results: [],
  theme: 'light'
};

const roleNames = {
  admin: 'Администратор',
  head: 'Руководитель',
  employee: 'Сотрудник'
};

const categoryNames = {
  service: 'Сервис',
  projects: 'Проекты',
  security: 'Безопасность',
  growth: 'Развитие'
};

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function seedData() {
  appState.users = [
    { id: 'u1', name: 'Алишер Каримов', role: 'head', department: 'Центр цифровой трансформации' },
    { id: 'u2', name: 'Нодира Султанова', role: 'employee', department: 'ИТ-служба' },
    { id: 'u3', name: 'Руслан Ахмедов', role: 'admin', department: 'Проектный офис' }
  ];

  appState.kpis = [
    { id: 'k1', name: 'Доступность сервисов LMS', category: 'service', weight: 30, target: 99 },
    { id: 'k2', name: 'Срок внедрения цифровых проектов', category: 'projects', weight: 25, target: 4 },
    { id: 'k3', name: 'Устранение ИБ-инцидентов (часы)', category: 'security', weight: 25, target: 6 },
    { id: 'k4', name: 'Обучение персонала цифровым навыкам (%)', category: 'growth', weight: 20, target: 80 }
  ];

  appState.results = [
    { id: uid('r'), userId: 'u2', kpiId: 'k1', fact: 98 },
    { id: uid('r'), userId: 'u2', kpiId: 'k4', fact: 76 },
    { id: uid('r'), userId: 'u1', kpiId: 'k2', fact: 5 },
    { id: uid('r'), userId: 'u3', kpiId: 'k3', fact: 4 }
  ];

  persist();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    seedData();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    appState.users = parsed.users || [];
    appState.kpis = parsed.kpis || [];
    appState.results = parsed.results || [];
    appState.theme = parsed.theme || 'light';
  } catch {
    seedData();
  }
}

function asPct(value) {
  return `${Math.round(value)}%`;
}

function kpiCompletion(kpi, fact) {
  if (!kpi || !kpi.target) return 0;
  return (fact / kpi.target) * 100;
}

function weightedKpi(kpi, fact) {
  return (kpiCompletion(kpi, fact) * kpi.weight) / 100;
}

function statusClass(score) {
  if (score < 80) return { text: 'Критический', className: 'bad' };
  if (score < 110) return { text: 'Целевой', className: 'warn' };
  return { text: 'Опережающий', className: 'ok' };
}

function calcGlobalKpi() {
  if (!appState.results.length) return 0;
  const total = appState.results.reduce((acc, row) => {
    const kpi = appState.kpis.find((k) => k.id === row.kpiId);
    return acc + weightedKpi(kpi, row.fact);
  }, 0);
  return total / appState.results.length;
}

function renderTabs() {
  const buttons = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

function renderUsers(filterRole = 'all') {
  const usersTable = document.getElementById('usersTable');
  const users = filterRole === 'all' ? appState.users : appState.users.filter((u) => u.role === filterRole);

  usersTable.innerHTML = users
    .map((u) => `<tr><td>${u.name}</td><td>${roleNames[u.role]}</td><td>${u.department}</td></tr>`)
    .join('');

  const userSelect = document.getElementById('resultUser');
  userSelect.innerHTML = appState.users.map((u) => `<option value="${u.id}">${u.name} (${u.department})</option>`).join('');
}

function renderKpis() {
  const kpiTable = document.getElementById('kpiTable');
  kpiTable.innerHTML = appState.kpis
    .map((k) => `
      <tr>
        <td>${k.name}</td>
        <td>${categoryNames[k.category]}</td>
        <td>${k.weight}%</td>
        <td>${k.target}</td>
        <td><button class="btn btn-ghost" data-del-kpi="${k.id}">Удалить</button></td>
      </tr>
    `)
    .join('');

  document.querySelectorAll('[data-del-kpi]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appState.kpis = appState.kpis.filter((k) => k.id !== btn.dataset.delKpi);
      appState.results = appState.results.filter((r) => r.kpiId !== btn.dataset.delKpi);
      persist();
      renderAll();
    });
  });

  const kpiSelect = document.getElementById('resultKpi');
  kpiSelect.innerHTML = appState.kpis.map((k) => `<option value="${k.id}">${k.name}</option>`).join('');
}

function renderResults(filterRole = 'all') {
  const rows = appState.results
    .map((r) => {
      const user = appState.users.find((u) => u.id === r.userId);
      const kpi = appState.kpis.find((k) => k.id === r.kpiId);
      if (!user || !kpi) return null;
      if (filterRole !== 'all' && user.role !== filterRole) return null;
      const pct = kpiCompletion(kpi, r.fact);
      const weighted = weightedKpi(kpi, r.fact);
      return {
        department: user.department,
        user: user.name,
        kpi: kpi.name,
        target: kpi.target,
        fact: r.fact,
        pct,
        weighted
      };
    })
    .filter(Boolean);

  document.getElementById('resultsTable').innerHTML = rows
    .map(
      (row) => `<tr>
      <td>${row.user}</td>
      <td>${row.kpi}</td>
      <td>${row.target}</td>
      <td>${row.fact}</td>
      <td>${asPct(row.pct)}</td>
      <td>${row.weighted.toFixed(2)}%</td>
    </tr>`
    )
    .join('');

  return rows;
}

function renderDashboard(rows) {
  const global = calcGlobalKpi();
  const status = statusClass(global);
  const autoMetrics = appState.kpis.length ? Math.max(70, Math.round((appState.kpis.length * 80) / 100)) : 0;

  document.getElementById('statsGrid').innerHTML = `
    <article class="stat"><p>Общий KPI</p><div class="value">${global.toFixed(1)}%</div></article>
    <article class="stat"><p>Статус</p><div class="value badge ${status.className}">${status.text}</div></article>
    <article class="stat"><p>Сотрудников в системе</p><div class="value">${appState.users.length}</div></article>
    <article class="stat"><p>Автоматизированные метрики</p><div class="value">${autoMetrics}%</div></article>
  `;

  const depMap = {};
  rows.forEach((r) => {
    if (!depMap[r.department]) depMap[r.department] = [];
    depMap[r.department].push(r.weighted);
  });

  const bars = Object.entries(depMap)
    .map(([dep, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const width = Math.min(avg, 140);
      return `<div class="bar-row"><strong>${dep}</strong><div class="bar"><div class="fill" style="width:${width}%"></div></div><small>${avg.toFixed(1)}%</small></div>`;
    })
    .join('');

  document.getElementById('departmentBars').innerHTML = bars || '<p class="muted">Нет данных для визуализации.</p>';
}

function renderReports(rows) {
  const grouped = {};
  rows.forEach((r) => {
    const key = `${r.department}__${r.user}`;
    if (!grouped[key]) grouped[key] = { department: r.department, user: r.user, values: [] };
    grouped[key].values.push(r.weighted);
  });

  const reportRows = Object.values(grouped).map((x) => {
    const avg = x.values.reduce((a, b) => a + b, 0) / x.values.length;
    const status = statusClass(avg);
    return { ...x, avg, status };
  });

  document.getElementById('reportTable').innerHTML = reportRows
    .map(
      (row) => `<tr>
      <td>${row.department}</td>
      <td>${row.user}</td>
      <td>${row.avg.toFixed(2)}%</td>
      <td class="badge ${row.status.className}">${row.status.text}</td>
    </tr>`
    )
    .join('');

  return reportRows;
}

function bindForms() {
  document.getElementById('userForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    appState.users.push({
      id: uid('u'),
      name: data.get('name').toString().trim(),
      role: data.get('role').toString(),
      department: data.get('department').toString().trim()
    });
    e.target.reset();
    persist();
    renderAll();
  });

  document.getElementById('kpiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    appState.kpis.push({
      id: uid('k'),
      name: data.get('name').toString().trim(),
      category: data.get('category').toString(),
      weight: Number(data.get('weight')),
      target: Number(data.get('target'))
    });
    e.target.reset();
    persist();
    renderAll();
  });

  document.getElementById('resultForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    appState.results.push({
      id: uid('r'),
      userId: data.get('userId').toString(),
      kpiId: data.get('kpiId').toString(),
      fact: Number(data.get('fact'))
    });
    e.target.reset();
    persist();
    renderAll();
  });

  document.getElementById('seedDataBtn').addEventListener('click', () => {
    seedData();
    renderAll();
  });

  document.getElementById('roleFilter').addEventListener('change', () => renderAll());

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    const roleFilter = document.getElementById('roleFilter').value;
    const rows = renderResults(roleFilter);
    const csv = ['Подразделение,Сотрудник,KPI,План,Факт,Выполнение %,Взвешенный KPI %']
      .concat(rows.map((r) => `${r.department},${r.user},${r.kpi},${r.target},${r.fact},${r.pct.toFixed(2)},${r.weighted.toFixed(2)}`))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kpi_report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('printBtn').addEventListener('click', () => window.print());

  document.getElementById('themeToggle').addEventListener('click', () => {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    persist();
  });
}

function applyTheme() {
  const isDark = appState.theme === 'dark';
  document.body.classList.toggle('dark', isDark);
  document.getElementById('themeToggle').textContent = isDark ? '☀️ Светлая тема' : '🌙 Тёмная тема';
}

function renderAll() {
  const filterRole = document.getElementById('roleFilter').value;
  renderUsers(filterRole);
  renderKpis();
  const rows = renderResults(filterRole);
  renderDashboard(rows);
  renderReports(rows);
}

loadState();
renderTabs();
bindForms();
applyTheme();
renderAll();
