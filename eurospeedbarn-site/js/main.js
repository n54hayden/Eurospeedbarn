// Eurospeedbarn site script.
// The booking form is a placeholder: it builds a request the customer can text
// to the shop. Swap it for a Square Appointments or Cal.com embed later.
(function () {
  var SHOP_SMS = "+16047862864";

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var form = document.getElementById("booking-form");
  if (!form) return;
  var result = document.getElementById("booking-result");
  var errorEl = document.getElementById("b-error");
  var summaryEl = document.getElementById("b-summary");
  var smsLink = document.getElementById("b-sms");
  var dateInput = document.getElementById("b-date");
  var serviceSelect = document.getElementById("b-service");

  // Earliest bookable date is today.
  var today = new Date();
  var pad = function (n) { return String(n).padStart(2, "0"); };
  dateInput.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());

  // "Book tires" style links preselect the service.
  document.querySelectorAll("[data-service]").forEach(function (link) {
    link.addEventListener("click", function () {
      serviceSelect.value = link.getAttribute("data-service");
    });
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = Object.fromEntries(new FormData(form).entries());

    var missing = [];
    if (!d.name.trim()) missing.push("your name");
    if (!d.phone.trim()) missing.push("a phone number");
    if (!d.vehicle.trim()) missing.push("your vehicle");
    if (!d.service) missing.push("a service");
    if (!d.date) missing.push("a date");
    if (!d.time) missing.push("a drop-off time");
    if (missing.length) {
      showError("Please add " + missing.join(", ") + ".");
      return;
    }

    var picked = new Date(d.date + "T12:00:00");
    var day = picked.getDay();
    if (day === 0 || day === 6) {
      showError("We're open Monday to Friday. Please pick a weekday.");
      return;
    }
    showError("");

    var dateText = picked.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
    var lines = [
      "Eurospeedbarn appointment request",
      "Name: " + d.name.trim(),
      "Phone: " + d.phone.trim(),
      "Vehicle: " + d.vehicle.trim() + (d.km.trim() ? " (" + d.km.trim() + " km)" : ""),
      "Service: " + d.service,
      "Preferred: " + dateText + " at " + d.time
    ];
    if (d.notes.trim()) lines.push("Notes: " + d.notes.trim());
    var text = lines.join("\n");

    summaryEl.textContent = text;
    smsLink.href = "sms:" + SHOP_SMS + "?&body=" + encodeURIComponent(text);
    form.hidden = true;
    result.hidden = false;
  });

  document.getElementById("b-edit").addEventListener("click", function () {
    result.hidden = true;
    form.hidden = false;
  });

  document.getElementById("b-copy").addEventListener("click", function () {
    var btn = this;
    var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 2000); };
    var fallback = function () {
      var range = document.createRange();
      range.selectNodeContents(summaryEl);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      btn.textContent = "Selected, press copy";
    };
    try {
      navigator.clipboard.writeText(summaryEl.textContent).then(done, fallback);
    } catch (err) {
      fallback();
    }
  });
})();
