'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Tool navigation supports keyboard arrows as well as normal tab navigation.
const tabs = $$('.tool-tab');
const panels = $$('[data-panel]');
function showTool(name, focusTab = false) {
  tabs.forEach((tab) => {
    const active = tab.dataset.view === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focusTab) tab.focus();
  });
  panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showTool(tab.dataset.view));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    showTool(tabs[next].dataset.view, true);
  });
});

// Optional theme preference is stored only in this browser.
const themeToggle = $('#theme-toggle');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  $('.theme-label', themeToggle).textContent = dark ? 'Light mode' : 'Dark mode';
}
try { setTheme(localStorage.getItem('everyday-toolkit-theme') || 'light'); } catch { setTheme('light'); }
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem('everyday-toolkit-theme', next); } catch { /* Storage is optional. */ }
});

// A small recursive-descent parser evaluates only arithmetic tokens; no eval/Function.
const calcInput = $('#calc-input');
const calcResult = $('#calc-result');
function evaluateExpression(source) {
  if (source.length > 200) throw new Error('Keep the calculation under 200 characters.');
  const compact = source.replace(/\s+/g, '');
  if (!compact) throw new Error('Enter a calculation first.');
  const tokens = compact.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/%]/g) || [];
  if (tokens.join('') !== compact) throw new Error('Use numbers and + − × ÷ % parentheses only.');
  let i = 0;
  function primary() {
    const token = tokens[i++];
    if (token === '+') return primary();
    if (token === '-') return -primary();
    if (token === '(') {
      const value = sum();
      if (tokens[i++] !== ')') throw new Error('Check the parentheses.');
      return value;
    }
    if (token === undefined || !/^\d|^\./.test(token)) throw new Error('Check the calculation.');
    return Number(token);
  }
  function product() {
    let value = primary();
    while (['*', '/', '%'].includes(tokens[i])) {
      const op = tokens[i++];
      const next = primary();
      if ((op === '/' || op === '%') && next === 0) throw new Error('Cannot divide by zero.');
      if (op === '*') value *= next;
      if (op === '/') value /= next;
      if (op === '%') value %= next;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++];
      const next = product();
      value = op === '+' ? value + next : value - next;
    }
    return value;
  }
  const answer = sum();
  if (i !== tokens.length) throw new Error('Check the calculation.');
  if (!Number.isFinite(answer)) throw new Error('That result is too large.');
  return Number(answer.toPrecision(12)).toString();
}
function calculate() {
  try {
    const answer = evaluateExpression(calcInput.value);
    calcInput.value = answer;
    calcResult.textContent = `Answer: ${answer}`;
  } catch (error) {
    calcResult.textContent = error.message;
  }
}
$$('[data-calc]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.calc;
  if (key === 'clear') { calcInput.value = ''; calcResult.textContent = 'Your answer appears here.'; }
  else if (key === 'back') { calcInput.value = calcInput.value.slice(0, -1); calcInput.focus(); }
  else if (key === 'equals') calculate();
  else { calcInput.value += key; calcInput.focus(); }
}));
calcInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); calculate(); }
  if (event.key === 'Escape') { calcInput.value = ''; calcResult.textContent = 'Your answer appears here.'; }
});

// Tip and bill split.
const tipForm = $('#tip-form');
function updateTip(event) {
  if (event) event.preventDefault();
  const bill = Number($('#bill-amount').value);
  const percent = Number($('#tip-percent').value);
  const people = Number($('#people-count').value);
  const output = $('#tip-result');
  if (!Number.isFinite(bill) || bill < 0 || !Number.isFinite(people) || !Number.isInteger(people) || people < 1) {
    output.innerHTML = '<span>Enter a valid amount and at least one person.</span><strong>—</strong>';
    return;
  }
  const each = (bill * (1 + percent / 100)) / people;
  output.innerHTML = `<span>Each person pays</span><strong>${each.toFixed(2)}</strong>`;
}
tipForm.addEventListener('submit', updateTip);
['bill-amount', 'tip-percent', 'people-count'].forEach((id) => $(`#${id}`).addEventListener('input', updateTip));

// Unit conversions use explicit base-unit factors; temperatures are handled separately.
const unitSets = {
  length: { m: ['Meter (m)', 1], km: ['Kilometer (km)', 1000], cm: ['Centimeter (cm)', .01], mm: ['Millimeter (mm)', .001], mi: ['Mile (mi)', 1609.344], yd: ['Yard (yd)', .9144], ft: ['Foot (ft)', .3048], in: ['Inch (in)', .0254] },
  weight: { kg: ['Kilogram (kg)', 1], g: ['Gram (g)', .001], mg: ['Milligram (mg)', .000001], lb: ['Pound (lb)', .45359237], oz: ['Ounce (oz)', .028349523125] },
  temperature: { c: ['Celsius (°C)'], f: ['Fahrenheit (°F)'], k: ['Kelvin (K)'] },
  volume: { l: ['Liter (L)', 1], ml: ['Milliliter (mL)', .001], m3: ['Cubic meter (m³)', 1000], cup: ['US cup', .2365882365], gal: ['US gallon', 3.785411784], floz: ['US fluid ounce', .0295735295625] }
};
const category = $('#unit-category');
const fromUnit = $('#unit-from');
const toUnit = $('#unit-to');
function fillUnitSelects() {
  const units = unitSets[category.value];
  const choices = Object.entries(units).map(([key, unit]) => `<option value="${key}">${unit[0]}</option>`).join('');
  fromUnit.innerHTML = choices;
  toUnit.innerHTML = choices;
  const keys = Object.keys(units);
  fromUnit.value = keys[0];
  toUnit.value = keys[1] || keys[0];
  if (category.value === 'temperature') { fromUnit.value = 'c'; toUnit.value = 'f'; }
  convertUnits();
}
function convertTemperature(value, from, to) {
  let celsius;
  if (from === 'c') celsius = value;
  else if (from === 'f') celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;
  if (to === 'c') return celsius;
  if (to === 'f') return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}
function prettyNumber(value) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.000001) return value.toExponential(4);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(Number(value.toPrecision(10)));
}
function convertUnits() {
  const value = Number($('#unit-value').value);
  const out = $('#unit-result');
  if (!Number.isFinite(value)) { out.textContent = '—'; return; }
  let converted;
  if (category.value === 'temperature') converted = convertTemperature(value, fromUnit.value, toUnit.value);
  else converted = value * unitSets[category.value][fromUnit.value][1] / unitSets[category.value][toUnit.value][1];
  out.textContent = prettyNumber(converted);
}
category.addEventListener('change', fillUnitSelects);
[fromUnit, toUnit, $('#unit-value')].forEach((el) => el.addEventListener('input', convertUnits));
[fromUnit, toUnit].forEach((el) => el.addEventListener('change', convertUnits));
fillUnitSelects();

// Text transforms are local. Word count treats Unicode letter/number sequences as words.
const textInput = $('#text-input');
function updateTextStats() {
  const text = textInput.value;
  const words = text.trim() ? (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length : 0;
  $('#word-count').textContent = words;
  $('#char-count').textContent = text.length;
  $('#line-count').textContent = text ? text.split(/\r\n|\r|\n/).length : 0;
}
textInput.addEventListener('input', updateTextStats);
$$('[data-text-action]').forEach((button) => button.addEventListener('click', () => {
  const action = button.dataset.textAction;
  const text = textInput.value;
  if (action === 'upper') textInput.value = text.toLocaleUpperCase();
  if (action === 'lower') textInput.value = text.toLocaleLowerCase();
  if (action === 'title') textInput.value = text.toLocaleLowerCase().replace(/(^|[\s([{])([\p{L}\p{N}])/gu, (_, prefix, letter) => prefix + letter.toLocaleUpperCase());
  if (action === 'sentence') textInput.value = text.toLocaleLowerCase().replace(/(^\s*[\p{L}]|[.!?]\s+[\p{L}])/gu, (match) => match.toLocaleUpperCase());
  if (action === 'trim') textInput.value = text.split(/\r\n|\r|\n/).map((line) => line.trim().replace(/\s+/g, ' ')).join('\n').trim();
  updateTextStats();
  $('#text-status').textContent = 'Text updated.';
  textInput.focus();
}));
async function copyText(value, statusElement) {
  if (!value) { statusElement.textContent = 'Nothing to copy yet.'; return; }
  try {
    await navigator.clipboard.writeText(value);
    statusElement.textContent = 'Copied to clipboard.';
  } catch {
    statusElement.textContent = 'Clipboard access is unavailable in this browser.';
  }
}
$('#copy-text').addEventListener('click', () => copyText(textInput.value, $('#text-status')));

// Date-only arithmetic uses UTC so time zones and daylight-saving changes cannot shift results.
function isoToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function parseISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time;
}
function readableDate(time) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(time));
}
const startDate = $('#date-start');
const endDate = $('#date-end');
const baseDate = $('#date-base');
const today = isoToday();
[startDate, endDate, baseDate].forEach((input) => { input.value = today; });
function updateDateDifference() {
  const a = parseISODate(startDate.value);
  const b = parseISODate(endDate.value);
  if (a === null || b === null) { $('#date-difference').textContent = 'Choose two valid dates.'; return; }
  const days = Math.round(Math.abs(b - a) / 86400000);
  $('#date-difference').textContent = `${days.toLocaleString()} ${days === 1 ? 'day' : 'days'} between ${readableDate(a)} and ${readableDate(b)}.`;
}
function updateDateAdded() {
  const start = parseISODate(baseDate.value);
  const amount = Number($('#date-offset').value);
  if (start === null || !Number.isInteger(amount) || Math.abs(amount) > 1000000) { $('#date-added').textContent = 'Choose a valid date and whole number of days.'; return; }
  $('#date-added').textContent = `${readableDate(start + amount * 86400000)} (${amount >= 0 ? '+' : ''}${amount.toLocaleString()} days).`;
}
[startDate, endDate].forEach((el) => el.addEventListener('input', updateDateDifference));
[baseDate, $('#date-offset')].forEach((el) => el.addEventListener('input', updateDateAdded));
updateDateDifference();
updateDateAdded();

// Cryptographic randomness from Web Crypto, with rejection sampling to avoid modulo bias.
const passwordLength = $('#password-length');
passwordLength.addEventListener('input', () => { $('#length-value').textContent = passwordLength.value; });
function secureIndex(max) {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure random numbers are not available in this browser.');
  const range = 0x100000000;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % max;
}
const passwordSets = [
  ['include-upper', 'ABCDEFGHJKLMNPQRSTUVWXYZ'],
  ['include-lower', 'abcdefghijkmnopqrstuvwxyz'],
  ['include-numbers', '23456789'],
  ['include-symbols', '!@#$%^&*()-_=+[]{}?']
];
$('#generate-password').addEventListener('click', () => {
  const selected = passwordSets.filter(([id]) => $(`#${id}`).checked);
  const length = Number(passwordLength.value);
  const status = $('#password-status');
  if (selected.length === 0) { status.textContent = 'Select at least one character type.'; return; }
  if (length < selected.length) { status.textContent = 'Increase the length to fit each selected character type.'; return; }
  try {
    const chars = selected.map(([, alphabet]) => alphabet[secureIndex(alphabet.length)]);
    const pool = selected.map(([, alphabet]) => alphabet).join('');
    while (chars.length < length) chars.push(pool[secureIndex(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    $('#password-result').textContent = chars.join('');
    status.textContent = 'Generated on this device.';
  } catch (error) {
    status.textContent = error.message;
  }
});
$('#copy-password').addEventListener('click', () => {
  const value = $('#password-result').textContent;
  if (value === 'Select Generate password') { $('#password-status').textContent = 'Generate a password first.'; return; }
  copyText(value, $('#password-status'));
});

// The app shell is cached so the tools can be reused after the first successful visit.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
