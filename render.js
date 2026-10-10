// render.js — чистые функции рендера (createElement, без innerHTML)

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function statusLabel(status) {
  const map = {
    pending: "Ожидает",
    in_transit: "В пути",
    delivered: "Доставлен",
    delayed: "Задержка",
    cancelled: "Отменён",
    available: "Свободен",
    on_route: "На маршруте",
    off_duty: "Не на смене",
    in_use: "В работе",
    maintenance: "ТО"
  };
  return map[status] || status;
}

// --- Карточка заказа ---
function renderOrderCard(order) {
  const article = createEl("article", "card card--order");
  article.dataset.id = order.id;

  const header = createEl("header", "card__header");
  header.appendChild(createEl("span", "card__id", order.id));
  header.appendChild(createEl("h3", "card__title", order.title));
  const badge = createEl("span", "badge badge--" + order.status, statusLabel(order.status));
  header.appendChild(badge);
  article.appendChild(header);

  const body = createEl("div", "card__body");
  body.appendChild(createEl("p", "card__desc", order.description));
  body.appendChild(createEl("p", null, "Клиент: " + order.client));
  body.appendChild(createEl("p", null, "Маршрут: " + order.route.from + " → " + order.route.to));
  body.appendChild(createEl("p", null, "Вес: " + order.weightKg + " кг · Стоимость: " + order.cost.toLocaleString("ru-RU") + " ₽"));
  article.appendChild(body);

  const meta = createEl("footer", "card__meta");
  const timeEl = createEl("time", null, formatDate(order.deliveryDate));
  timeEl.setAttribute("datetime", order.deliveryDate);
  meta.appendChild(timeEl);
  meta.appendChild(createEl("span", "priority priority--" + order.priority, order.priority));
  article.appendChild(meta);

  return article;
}

// --- Строка таблицы заказов ---
function renderOrderRow(order) {
  const tr = createEl("tr");
  tr.dataset.id = order.id;

  const labels = ["ID", "Название", "Клиент", "Статус", "Маршрут", "Стоимость", "Дата"];
  const cells = [
    order.id,
    order.title,
    order.client,
    statusLabel(order.status),
    order.route.from + " → " + order.route.to,
    order.cost.toLocaleString("ru-RU") + " ₽",
    formatDate(order.deliveryDate)
  ];

  cells.forEach(function (text, i) {
    const td = createEl("td");
    td.setAttribute("data-label", labels[i]);
    if (i === 3) {
      td.appendChild(createEl("span", "badge badge--" + order.status, statusLabel(order.status)));
    } else if (i === 6) {
      const t = createEl("time", null, formatDate(order.deliveryDate));
      t.setAttribute("datetime", order.deliveryDate);
      td.appendChild(t);
    } else {
      td.textContent = text;
    }
    tr.appendChild(td);
  });

  return tr;
}

// --- Карточка водителя ---
function renderDriverCard(driver) {
  const article = createEl("article", "card card--driver");
  article.dataset.id = driver.id;

  const header = createEl("header", "card__header");
  header.appendChild(createEl("span", "card__id", driver.id));
  header.appendChild(createEl("h3", "card__title", driver.name));
  header.appendChild(createEl("span", "badge badge--" + driver.status, statusLabel(driver.status)));
  article.appendChild(header);

  const body = createEl("div", "card__body");
  body.appendChild(createEl("p", null, "Тел: " + driver.phone));
  body.appendChild(createEl("p", null, "Категория: " + driver.licenseCategory + " · Стаж: " + driver.experienceYears + " лет"));
  body.appendChild(createEl("p", null, "Регион: " + driver.region + " · Рейтинг: " + driver.rating));
  body.appendChild(createEl("p", null, "ТС: " + driver.vehicleId));
  article.appendChild(body);

  const meta = createEl("footer", "card__meta");
  const hired = createEl("time", null, "с " + formatDate(driver.hireDate));
  hired.setAttribute("datetime", driver.hireDate);
  meta.appendChild(hired);
  meta.appendChild(createEl("span", null, driver.certificates.join(", ")));
  article.appendChild(meta);

  return article;
}

// --- Карточка ТС ---
function renderVehicleCard(vehicle) {
  const article = createEl("article", "card card--vehicle");
  article.dataset.id = vehicle.id;

  const header = createEl("header", "card__header");
  header.appendChild(createEl("span", "card__id", vehicle.id));
  header.appendChild(createEl("h3", "card__title", vehicle.model));
  header.appendChild(createEl("span", "badge badge--" + vehicle.status, statusLabel(vehicle.status)));
  article.appendChild(header);

  const body = createEl("div", "card__body");
  body.appendChild(createEl("p", null, "Госномер: " + vehicle.plate));
  body.appendChild(createEl("p", null, "Тип: " + vehicle.type + " · Грузоподъёмность: " + vehicle.capacityKg + " кг"));
  body.appendChild(createEl("p", null, "Год: " + vehicle.year + " · Пробег: " + vehicle.mileageKm.toLocaleString("ru-RU") + " км"));
  body.appendChild(createEl("p", null, "Топливо: " + vehicle.fuelType));
  article.appendChild(body);

  const meta = createEl("footer", "card__meta");
  const service = createEl("time", null, "ТО: " + formatDate(vehicle.lastService));
  service.setAttribute("datetime", vehicle.lastService);
  meta.appendChild(service);
  meta.appendChild(createEl("span", null, vehicle.features.join(", ")));
  article.appendChild(meta);

  return article;
}

function renderCardList(items, renderFn) {
  const fragment = document.createDocumentFragment();
  items.forEach(function (item) {
    fragment.appendChild(renderFn(item));
  });
  return fragment;
}

function renderOrdersTableBody(ordersList) {
  const fragment = document.createDocumentFragment();
  ordersList.forEach(function (order) {
    fragment.appendChild(renderOrderRow(order));
  });
  return fragment;
}
