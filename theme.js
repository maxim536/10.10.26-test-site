// theme.js — темы, акцент, системные настройки

function hexToRgb(hex) {
  var h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  var n = parseInt(h, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function applyAccent(hex) {
  var rgb = hexToRgb(hex);
  var root = document.documentElement;
  root.style.setProperty("--accent-hex", hex);
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--accent-rgb", rgb.r + ", " + rgb.g + ", " + rgb.b);
  localStorage.setItem("logipanel-accent", hex);
}

function setTheme(theme, manual) {
  document.documentElement.setAttribute("data-theme", theme);
  if (manual) {
    localStorage.setItem("logipanel-theme", theme);
    localStorage.setItem("logipanel-theme-manual", "1");
  }
  var select = document.getElementById("theme-select");
  if (select) select.value = theme;
}

document.addEventListener("DOMContentLoaded", function () {
  var select = document.getElementById("theme-select");
  var picker = document.getElementById("accent-picker");
  var current = document.documentElement.getAttribute("data-theme") || "dark";
  if (select) select.value = current;

  localStorage.setItem("logipanel-theme", localStorage.getItem("logipanel-theme") || "dark");
  document.documentElement.setAttribute("data-theme", localStorage.getItem("logipanel-theme") || "dark");
  var savedAccent = localStorage.getItem("logipanel-accent") || "#2563eb";
  if (picker) {
    picker.value = savedAccent;
    applyAccent(savedAccent);
  }

  if (select) {
    select.addEventListener("change", function () {
      setTheme(select.value, true);
    });
  }

  if (picker) {
    picker.addEventListener("input", function () {
      applyAccent(picker.value);
    });
  }

  // Системная тема, если пользователь не выбирал вручную
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function onSystemChange(e) {
    if (localStorage.getItem("logipanel-theme-manual")) return;
    setTheme(e.matches ? "dark" : "light", false);
  }
  if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);
});
