/* ============================================================
   관리자 페이지 로직
   - 비밀번호 확인 (SHA-256 해시 비교, 클라이언트 단순 인증)
   - Google Apps Script 웹앱에서 실시간 데이터 조회
   - AES 복호화 후 표에 렌더링
   - 30초 간격 자동 새로고침
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.SEMINAR_CONFIG || {};
  var SESSION_KEY = "seminar_admin_authed";
  var AUTO_REFRESH_MS = 30000;

  var gate = document.getElementById("adminGate");
  var main = document.getElementById("adminMain");
  var pwInput = document.getElementById("gatePassword");
  var gateBtn = document.getElementById("gateSubmit");
  var gateError = document.getElementById("gateError");
  var tbody = document.getElementById("adminTableBody");
  var statusPill = document.getElementById("statusPill");
  var rowCount = document.getElementById("rowCount");
  var refreshBtn = document.getElementById("refreshBtn");
  var logoutBtn = document.getElementById("logoutBtn");

  var timer = null;

  /* ---------------- 인증 ---------------- */
  function sha256(text) {
    return CryptoJS.SHA256(text).toString();
  }

  function tryLogin() {
    var value = pwInput.value || "";
    if (sha256(value) === CONFIG.ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      showDashboard();
    } else {
      gateError.textContent = "비밀번호가 올바르지 않습니다.";
      pwInput.value = "";
      pwInput.focus();
    }
  }

  gateBtn.addEventListener("click", tryLogin);
  pwInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") tryLogin();
  });

  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    if (timer) clearInterval(timer);
    main.style.display = "none";
    gate.style.display = "flex";
    pwInput.value = "";
  });

  function showDashboard() {
    gate.style.display = "none";
    main.style.display = "block";
    loadData();
    timer = setInterval(loadData, AUTO_REFRESH_MS);
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    showDashboard();
  }

  /* ---------------- 복호화 ---------------- */
  function decrypt(cipherText) {
    try {
      var bytes = CryptoJS.AES.decrypt(cipherText, CONFIG.AES_SECRET_KEY);
      var plain = bytes.toString(CryptoJS.enc.Utf8);
      return plain || "(복호화 실패)";
    } catch (err) {
      return "(복호화 실패)";
    }
  }

  function formatTimestamp(raw) {
    var d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  /* ---------------- 데이터 조회 ---------------- */
  function loadData() {
    if (!CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL.indexOf("여기에") !== -1) {
      statusPill.textContent = "설정 필요";
      statusPill.className = "status-pill";
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">js/config.js 의 GAS_WEB_APP_URL 을 설정해주세요.</td></tr>';
      return;
    }

    statusPill.textContent = "불러오는 중";
    statusPill.className = "status-pill";

    fetch(CONFIG.GAS_WEB_APP_URL, { method: "GET", cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        renderRows(rows || []);
        statusPill.textContent = "실시간 연동중";
        statusPill.className = "status-pill live";
      })
      .catch(function (err) {
        console.error(err);
        statusPill.textContent = "연결 오류";
        statusPill.className = "status-pill";
        tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">데이터를 불러오지 못했습니다. GAS 배포 상태를 확인해주세요.</td></tr>';
      });
  }

  function renderRows(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">아직 접수된 신청이 없습니다.</td></tr>';
      rowCount.textContent = "";
      return;
    }

    rowCount.textContent = "총 " + rows.length + "건";

    var html = rows
      .slice()
      .reverse()
      .map(function (row) {
        return (
          "<tr>" +
          "<td>" + formatTimestamp(row.timestamp) + "</td>" +
          "<td>" + decrypt(row.name) + "</td>" +
          "<td>" + decrypt(row.gender) + "</td>" +
          "<td>" + decrypt(row.birth) + "</td>" +
          "<td>" + decrypt(row.phone) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    tbody.innerHTML = html;
  }

  refreshBtn.addEventListener("click", loadData);
})();
