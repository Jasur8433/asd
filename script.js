const form = document.getElementById('kpi-form');
const result = document.getElementById('result');
const errorBox = document.getElementById('form-error');

function getNumber(formData, name) {
  return Number(formData.get(name));
}

function calculateWeightedKpi(weights, scores) {
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  if (sumWeights !== 100) {
    return { error: 'Сумма весов должна быть равна 100%.' };
  }

  const kpi = weights.reduce((acc, weight, i) => {
    return acc + (weight / 100) * scores[i];
  }, 0);

  return { kpi: Number(kpi.toFixed(2)) };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const data = new FormData(form);
  const weights = [
    getNumber(data, 'wService'),
    getNumber(data, 'wProject'),
    getNumber(data, 'wSecurity'),
    getNumber(data, 'wGrowth')
  ];

  const scores = [
    getNumber(data, 'sService'),
    getNumber(data, 'sProject'),
    getNumber(data, 'sSecurity'),
    getNumber(data, 'sGrowth')
  ];

  const invalid = [...weights, ...scores].some((v) => Number.isNaN(v) || v < 0);
  if (invalid) {
    errorBox.textContent = 'Введите корректные неотрицательные числовые значения.';
    return;
  }

  const { kpi, error } = calculateWeightedKpi(weights, scores);
  if (error) {
    errorBox.textContent = error;
    result.innerHTML = 'Интегральный KPI: <strong>—</strong>';
    return;
  }

  let level = 'целевой';
  if (kpi < 80) level = 'критический';
  if (kpi >= 110) level = 'опережающий';

  result.innerHTML = `Интегральный KPI: <strong>${kpi}%</strong> (${level} уровень).`;
});
