// app.js — навигация, фильтры, модалки, toast, a11y-компоненты

let currentSection = "orders";
let filteredOrders = orders.slice();
let sortKey = null;
let sortDir = "asc";
let isLoading = false;

function showToast(message, type) {
  type = type || "info";
  var root = document.getElementById("toast-root");
  var el = document.createElement("div");
  el.className = "toast toast--" + type;
  el.setAttribute("role", "status");
  el.textContent = message;
  root.appendChild(el);
  requestAnimationFrame(function () {
    el.classList.add("toast--show");
  });
  setTimeout(function () {
    el.classList.remove("toast--show");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }, 3200);
}

document.addEventListener("DOMContentLoaded", function () {
  var main = document.getElementById("main-content");
  var navLinks = document.querySelectorAll(".nav__link");
  var overlay = document.getElementById("modal-overlay");
  var modalBody = document.getElementById("modal-body");
  var modalTitle = document.getElementById("modal-title");
  var formOverlay = document.getElementById("form-modal-overlay");

  // Мобильное меню
  var burger = document.getElementById("burger");
  var sidebar = document.getElementById("sidebar");
  var sideOverlay = document.getElementById("sidebar-overlay");

  function openMenu() {
    sidebar.classList.add("sidebar--open");
    sideOverlay.hidden = false;
    burger.setAttribute("aria-expanded", "true");
    burger.classList.add("burger--open");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    sidebar.classList.remove("sidebar--open");
    sideOverlay.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.classList.remove("burger--open");
    if (overlay.hidden && formOverlay.hidden) document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    if (sidebar.classList.contains("sidebar--open")) closeMenu();
    else openMenu();
  });
  sideOverlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("sidebar--open")) closeMenu();
  });

  function setActiveNav(section) {
    navLinks.forEach(function (link) {
      var active = link.dataset.section === section;
      link.classList.toggle("nav__link--active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function applyFilters() {
    var search = (document.getElementById("filter-search") || {}).value || "";
    var status = (document.getElementById("filter-status") || {}).value || "";
    var priorities = [];
    document.querySelectorAll('input[name="priority"]:checked').forEach(function (cb) {
      priorities.push(cb.value);
    });

    filteredOrders = orders.filter(function (o) {
      var matchSearch =
        !search ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.client.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase());
      var matchStatus = !status || o.status === status;
      var matchPriority = priorities.length === 0 || priorities.includes(o.priority);
      return matchSearch && matchStatus && matchPriority;
    });

    if (sortKey) {
      filteredOrders.sort(function (a, b) {
        var va = a[sortKey];
        var vb = b[sortKey];
        if (sortKey === "cost" || sortKey === "weightKg") {
          va = Number(va);
          vb = Number(vb);
        } else {
          va = String(va).toLowerCase();
          vb = String(vb).toLowerCase();
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    renderOrdersView();
  }

  function renderFilters() {
    var panel = createEl("aside", "filters filters--bar");
    panel.setAttribute("aria-label", "Фильтры заказов");

    var row = createEl("div", "filters__row");

    // Поиск
    var searchWrap = createEl("div", "filter-chip filter-chip--search");
    var searchLabel = createEl("label", "sr-only", "Поиск");
    searchLabel.setAttribute("for", "filter-search");
    searchWrap.appendChild(searchLabel);
    var searchInput = createEl("input", "input input--search");
    searchInput.type = "search";
    searchInput.id = "filter-search";
    searchInput.placeholder = "ID, название, клиент…";
    searchInput.addEventListener("input", applyFilters);
    searchWrap.appendChild(searchInput);
    row.appendChild(searchWrap);

    // Статус
    var statusWrap = createEl("div", "filter-chip");
    var statusLabel = createEl("label", "sr-only", "Статус");
    statusLabel.setAttribute("for", "filter-status");
    statusWrap.appendChild(statusLabel);
    var select = createEl("select", "select select--chip");
    select.id = "filter-status";
    select.setAttribute("aria-label", "Статус");
    [
      { v: "", t: "Статус: Все" },
      { v: "pending", t: "Ожидает" },
      { v: "in_transit", t: "В пути" },
      { v: "delivered", t: "Доставлен" },
      { v: "delayed", t: "Задержка" },
      { v: "cancelled", t: "Отменён" }
    ].forEach(function (opt) {
      var o = createEl("option", null, opt.t);
      o.value = opt.v;
      select.appendChild(o);
    });
    select.addEventListener("change", applyFilters);
    statusWrap.appendChild(select);
    row.appendChild(statusWrap);

    // Приоритет — чипы
    var prioWrap = createEl("div", "filter-chip filter-chip--group");
    prioWrap.appendChild(createEl("span", "filter-chip__label", "Приоритет"));
    ["high", "medium", "low"].forEach(function (p) {
      var wrap = createEl("label", "chip-toggle");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.name = "priority";
      input.value = p;
      input.addEventListener("change", applyFilters);
      wrap.appendChild(input);
      wrap.appendChild(createEl("span", "chip-toggle__text",
        p === "high" ? "Высокий" : p === "medium" ? "Средний" : "Низкий"
      ));
      prioWrap.appendChild(wrap);
    });
    row.appendChild(prioWrap);

    // Вид — чипы
    var viewWrap = createEl("div", "filter-chip filter-chip--group");
    viewWrap.appendChild(createEl("span", "filter-chip__label", "Вид"));
    ["cards", "table"].forEach(function (v, i) {
      var wrap = createEl("label", "chip-toggle");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "view";
      input.value = v;
      if (i === 0) input.checked = true;
      input.addEventListener("change", renderOrdersView);
      wrap.appendChild(input);
      wrap.appendChild(createEl("span", "chip-toggle__text",
        v === "cards" ? "Карточки" : "Таблица"
      ));
      viewWrap.appendChild(wrap);
    });
    row.appendChild(viewWrap);

    // Сброс
    var resetBtn = createEl("button", "btn btn--secondary btn--chip");
    resetBtn.type = "button";
    resetBtn.textContent = "Сбросить";
    resetBtn.addEventListener("click", function () {
      document.getElementById("filter-search").value = "";
      document.getElementById("filter-status").value = "";
      document.querySelectorAll('input[name="priority"]').forEach(function (cb) {
        cb.checked = false;
      });
      var cardsRadio = document.querySelector('input[name="view"][value="cards"]');
      if (cardsRadio) cardsRadio.checked = true;
      sortKey = null;
      applyFilters();
      showToast("Фильтры сброшены", "info");
    });
    row.appendChild(resetBtn);

    panel.appendChild(row);
    return panel;
  }

  function renderEmptyState(text) {
    var box = createEl("div", "empty-state");
    box.appendChild(createEl("p", "empty-state__icon", "📦"));
    box.appendChild(createEl("p", "empty-state__text", text || "Ничего не найдено"));
    return box;
  }

  function renderSkeleton() {
    var wrap = createEl("div", "skeleton-grid");
    for (var i = 0; i < 6; i++) {
      var s = createEl("div", "skeleton-card");
      s.appendChild(createEl("div", "skeleton skeleton--title"));
      s.appendChild(createEl("div", "skeleton skeleton--line"));
      s.appendChild(createEl("div", "skeleton skeleton--line skeleton--short"));
      wrap.appendChild(s);
    }
    return wrap;
  }

  function renderOrdersView() {
    var existing = main.querySelector(".orders-wrap");
    if (existing) existing.remove();

    var wrap = createEl("div", "orders-wrap");
    // Контент должен быть внутри секции с фильтрами, иначе ломается grid-layout
    var section = main.querySelector(".section--with-filters");
    var target = section || main;

    if (isLoading) {
      wrap.appendChild(renderSkeleton());
      target.appendChild(wrap);
      return;
    }

    if (filteredOrders.length === 0) {
      wrap.appendChild(renderEmptyState("Заказы не найдены. Измените фильтры."));
      target.appendChild(wrap);
      return;
    }

    var view = (document.querySelector('input[name="view"]:checked') || {}).value || "cards";

    if (view === "cards") {
      var grid = createEl("div", "cards-grid");
      grid.appendChild(renderCardList(filteredOrders, renderOrderCard));
      wrap.appendChild(grid);
      grid.addEventListener("click", function (e) {
        var card = e.target.closest(".card");
        if (card) openOrderModal(card.dataset.id);
      });
    } else {
      var table = createEl("table", "data-table");
      table.appendChild(createEl("caption", null, "Заказы (" + filteredOrders.length + ")"));
      var thead = createEl("thead");
      var headRow = createEl("tr");
      var cols = [
        { key: "id", title: "ID" },
        { key: "title", title: "Название" },
        { key: "client", title: "Клиент" },
        { key: "status", title: "Статус" },
        { key: "route", title: "Маршрут" },
        { key: "cost", title: "Стоимость" },
        { key: "deliveryDate", title: "Дата" }
      ];
      cols.forEach(function (col) {
        var th = createEl("th");
        th.setAttribute("scope", "col");
        var btn = createEl("button", "th-sort", col.title);
        btn.type = "button";
        if (sortKey === col.key) {
          btn.textContent = col.title + (sortDir === "asc" ? " ↑" : " ↓");
          btn.setAttribute("aria-sort", sortDir === "asc" ? "ascending" : "descending");
        }
        btn.addEventListener("click", function () {
          if (sortKey === col.key) sortDir = sortDir === "asc" ? "desc" : "asc";
          else {
            sortKey = col.key;
            sortDir = "asc";
          }
          applyFilters();
        });
        th.appendChild(btn);
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);
      var tbody = createEl("tbody");
      tbody.appendChild(renderOrdersTableBody(filteredOrders));
      table.appendChild(tbody);
      wrap.appendChild(table);

      tbody.addEventListener("click", function (e) {
        var tr = e.target.closest("tr");
        if (tr && tr.dataset.id) openOrderModal(tr.dataset.id);
      });
    }
    target.appendChild(wrap);
  }

  function showOrders() {
    currentSection = "orders";
    setActiveNav("orders");
    main.textContent = "";
    var section = createEl("section", "section section--with-filters");
    section.appendChild(createEl("h2", "section__title", "Заказы"));
    section.appendChild(renderFilters());
    main.appendChild(section);

    isLoading = true;
    renderOrdersView();
    setTimeout(function () {
      isLoading = false;
      filteredOrders = orders.slice();
      renderOrdersView();
    }, 600);
  }

  function showDrivers() {
    currentSection = "drivers";
    setActiveNav("drivers");
    main.textContent = "";
    var section = createEl("section", "section");
    section.appendChild(createEl("h2", "section__title", "Водители"));
    var grid = createEl("div", "cards-grid");
    grid.appendChild(renderCardList(drivers, renderDriverCard));
    section.appendChild(grid);
    main.appendChild(section);
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (card) openDriverModal(card.dataset.id);
    });
  }

  function showVehicles() {
    currentSection = "vehicles";
    setActiveNav("vehicles");
    main.textContent = "";
    var section = createEl("section", "section");
    section.appendChild(createEl("h2", "section__title", "Транспорт"));
    var grid = createEl("div", "cards-grid");
    grid.appendChild(renderCardList(vehicles, renderVehicleCard));
    section.appendChild(grid);
    main.appendChild(section);
  }

  // --- Справка: табы + аккордеон ---
  function showHelp() {
    currentSection = "help";
    setActiveNav("help");
    main.textContent = "";
    var section = createEl("section", "section");
    section.appendChild(createEl("h2", "section__title", "Справка"));

    // Табы
    var tablist = createEl("div", "tabs");
    tablist.setAttribute("role", "tablist");
    var tabs = [
      { id: "tab-faq", label: "FAQ" },
      { id: "tab-status", label: "Статусы" },
      { id: "tab-contact", label: "Контакты" }
    ];
    var panels = {};

    tabs.forEach(function (t, i) {
      var btn = createEl("button", "tabs__btn" + (i === 0 ? " tabs__btn--active" : ""));
      btn.type = "button";
      btn.id = t.id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
      btn.setAttribute("aria-controls", t.id + "-panel");
      btn.setAttribute("tabindex", i === 0 ? "0" : "-1");
      btn.textContent = t.label;
      tablist.appendChild(btn);
    });
    section.appendChild(tablist);

    var panelFaq = createEl("div", "tabs__panel");
    panelFaq.id = "tab-faq-panel";
    panelFaq.setAttribute("role", "tabpanel");
    panelFaq.setAttribute("aria-labelledby", "tab-faq");

    // Аккордеон
    var accordion = createEl("div", "accordion");
    var items = [
      { q: "Как создать заказ?", a: "Нажмите «Новый заказ» в шапке, заполните форму и отправьте." },
      { q: "Что значит статус «Задержка»?", a: "Доставка не уложилась в плановый срок. Свяжитесь с диспетчером." },
      { q: "Как сменить тему?", a: "В шапке выберите тему и акцентный цвет. Настройки сохраняются." }
    ];
    items.forEach(function (item, idx) {
      var accItem = createEl("div", "accordion__item");
      var accBtn = createEl("button", "accordion__btn");
      accBtn.type = "button";
      accBtn.setAttribute("aria-expanded", "false");
      accBtn.setAttribute("aria-controls", "acc-panel-" + idx);
      accBtn.id = "acc-btn-" + idx;
      accBtn.textContent = item.q;
      var accPanel = createEl("div", "accordion__panel");
      accPanel.id = "acc-panel-" + idx;
      accPanel.setAttribute("role", "region");
      accPanel.setAttribute("aria-labelledby", "acc-btn-" + idx);
      accPanel.hidden = true;
      accPanel.appendChild(createEl("p", null, item.a));
      accBtn.addEventListener("click", function () {
        var open = accBtn.getAttribute("aria-expanded") === "true";
        accBtn.setAttribute("aria-expanded", open ? "false" : "true");
        accPanel.hidden = open;
      });
      accItem.appendChild(accBtn);
      accItem.appendChild(accPanel);
      accordion.appendChild(accItem);
    });
    panelFaq.appendChild(accordion);

    var panelStatus = createEl("div", "tabs__panel");
    panelStatus.id = "tab-status-panel";
    panelStatus.setAttribute("role", "tabpanel");
    panelStatus.setAttribute("aria-labelledby", "tab-status");
    panelStatus.hidden = true;
    panelStatus.appendChild(createEl("p", null, "Ожидает — заказ принят, не отправлен."));
    panelStatus.appendChild(createEl("p", null, "В пути — груз едет к клиенту."));
    panelStatus.appendChild(createEl("p", null, "Доставлен — заказ выполнен."));
    panelStatus.appendChild(createEl("p", null, "Задержка — срок сорван."));
    panelStatus.appendChild(createEl("p", null, "Отменён — заказ отменён."));

    var panelContact = createEl("div", "tabs__panel");
    panelContact.id = "tab-contact-panel";
    panelContact.setAttribute("role", "tabpanel");
    panelContact.setAttribute("aria-labelledby", "tab-contact");
    panelContact.hidden = true;
    panelContact.appendChild(createEl("p", null, "Диспетчер: +7 (495) 000-00-00"));
    panelContact.appendChild(createEl("p", null, "Email: support@logipanel.local"));

    section.appendChild(panelFaq);
    section.appendChild(panelStatus);
    section.appendChild(panelContact);
    main.appendChild(section);

    // Навигация табов стрелками
    var tabButtons = tablist.querySelectorAll('[role="tab"]');
    var panelMap = {
      "tab-faq": panelFaq,
      "tab-status": panelStatus,
      "tab-contact": panelContact
    };

    function activateTab(btn) {
      tabButtons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("tabs__btn--active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.setAttribute("tabindex", on ? "0" : "-1");
        panelMap[b.id].hidden = !on;
      });
      btn.focus();
    }

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activateTab(btn);
      });
      btn.addEventListener("keydown", function (e) {
        var idx = Array.prototype.indexOf.call(tabButtons, btn);
        var next = idx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % tabButtons.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + tabButtons.length) % tabButtons.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabButtons.length - 1;
        else return;
        e.preventDefault();
        activateTab(tabButtons[next]);
      });
    });
  }

  function openModal(title, contentNodes) {
    modalTitle.textContent = title;
    modalBody.textContent = "";
    contentNodes.forEach(function (n) {
      modalBody.appendChild(n);
    });
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("modal-close").focus();
  }
  function closeModal() {
    overlay.hidden = true;
    if (formOverlay.hidden) document.body.style.overflow = "";
  }

  function openOrderModal(id) {
    var o = orders.find(function (x) {
      return x.id === id;
    });
    if (!o) return;
    var nodes = [
      createEl("p", null, "Клиент: " + o.client),
      createEl("p", null, "Статус: " + statusLabel(o.status)),
      createEl("p", null, "Приоритет: " + o.priority),
      createEl("p", null, "Описание: " + o.description),
      createEl("p", null, "Маршрут: " + o.route.from + " → " + o.route.to + " (" + o.route.distanceKm + " км)"),
      createEl("p", null, "Вес: " + o.weightKg + " кг"),
      createEl("p", null, "Стоимость: " + o.cost.toLocaleString("ru-RU") + " ₽"),
      createEl("p", null, "Состав: " + o.items.join(", "))
    ];
    var t = createEl("time", null, "Доставка: " + formatDate(o.deliveryDate));
    t.setAttribute("datetime", o.deliveryDate);
    nodes.push(t);
    openModal(o.id + " — " + o.title, nodes);
  }

  function openDriverModal(id) {
    var d = drivers.find(function (x) {
      return x.id === id;
    });
    if (!d) return;
    openModal(d.name, [
      createEl("p", null, "ID: " + d.id),
      createEl("p", null, "Телефон: " + d.phone),
      createEl("p", null, "Статус: " + statusLabel(d.status)),
      createEl("p", null, "Категория: " + d.licenseCategory),
      createEl("p", null, "Стаж: " + d.experienceYears + " лет"),
      createEl("p", null, "Рейтинг: " + d.rating),
      createEl("p", null, "Регион: " + d.region),
      createEl("p", null, "ТС: " + d.vehicleId),
      createEl("p", null, "Сертификаты: " + d.certificates.join(", "))
    ]);
  }

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  // Форма нового заказа
  function openFormModal() {
    formOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("order-title").focus();
  }
  function closeFormModal() {
    formOverlay.hidden = true;
    if (overlay.hidden) document.body.style.overflow = "";
    document.getElementById("order-form").reset();
    clearFormErrors();
  }

  function clearFormErrors() {
    ["title", "client", "email", "desc"].forEach(function (k) {
      var err = document.getElementById("err-" + k);
      var input = document.getElementById(
        k === "desc" ? "order-desc" : k === "title" ? "order-title" : k === "client" ? "order-client" : "order-email"
      );
      if (err) err.textContent = "";
      if (input) input.classList.remove("input--error");
    });
  }

  function validateField(input, errId, checks) {
    var err = document.getElementById(errId);
    for (var i = 0; i < checks.length; i++) {
      if (!checks[i].ok) {
        err.textContent = checks[i].msg;
        input.classList.add("input--error");
        return false;
      }
    }
    err.textContent = "";
    input.classList.remove("input--error");
    return true;
  }

  function validateForm() {
    var title = document.getElementById("order-title");
    var client = document.getElementById("order-client");
    var email = document.getElementById("order-email");
    var desc = document.getElementById("order-desc");
    var ok = true;

    ok =
      validateField(title, "err-title", [
        { ok: title.value.trim().length > 0, msg: "Укажите название" },
        { ok: title.value.trim().length >= 3, msg: "Минимум 3 символа" }
      ]) && ok;

    ok =
      validateField(client, "err-client", [
        { ok: client.value.trim().length > 0, msg: "Укажите клиента" },
        { ok: client.value.trim().length >= 2, msg: "Минимум 2 символа" }
      ]) && ok;

    if (email.value.trim()) {
      ok =
        validateField(email, "err-email", [
          {
            ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
            msg: "Некорректный email"
          }
        ]) && ok;
    } else {
      document.getElementById("err-email").textContent = "";
      email.classList.remove("input--error");
    }

    ok =
      validateField(desc, "err-desc", [
        { ok: desc.value.trim().length > 0, msg: "Укажите описание" },
        { ok: desc.value.trim().length >= 10, msg: "Минимум 10 символов" }
      ]) && ok;

    return ok;
  }

  ["order-title", "order-client", "order-email", "order-desc"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("blur", validateForm);
    el.addEventListener("input", function () {
      if (el.classList.contains("input--error")) validateForm();
    });
  });

  document.getElementById("order-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Исправьте ошибки в форме", "error");
      var firstErr = document.querySelector("#order-form .input--error");
      if (firstErr) firstErr.focus();
      return;
    }
    var title = document.getElementById("order-title").value.trim();
    var newId = "ORD-" + (1000 + orders.length + 1);
    orders.unshift({
      id: newId,
      title: title,
      description: document.getElementById("order-desc").value.trim(),
      status: "pending",
      priority: document.getElementById("order-priority").value,
      createdAt: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      client: document.getElementById("order-client").value.trim(),
      weightKg: 100,
      cost: 10000,
      route: { from: "Москва", to: "—", distanceKm: 0 },
      items: ["Новый груз"]
    });
    closeFormModal();
    showToast("Заказ " + newId + " создан", "success");
    if (currentSection === "orders") {
      filteredOrders = orders.slice();
      applyFilters();
    }
  });

  document.getElementById("btn-new-order").addEventListener("click", openFormModal);
  document.getElementById("form-modal-close").addEventListener("click", closeFormModal);
  document.getElementById("form-modal-cancel").addEventListener("click", closeFormModal);
  formOverlay.addEventListener("click", function (e) {
    if (e.target === formOverlay) closeFormModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!formOverlay.hidden) closeFormModal();
      else if (!overlay.hidden) closeModal();
    }
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      closeMenu();
      var s = link.dataset.section;
      if (s === "orders") showOrders();
      else if (s === "drivers") showDrivers();
      else if (s === "vehicles") showVehicles();
      else if (s === "help") showHelp();
    });
  });

  showOrders();
});
