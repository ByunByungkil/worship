/* ============================================================
   26' 초대교회 예배여행 — 신청 폼 로직
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.SEMINAR_CONFIG || {};
  var form = document.getElementById("registerForm");
  var submitBtn = document.getElementById("submitBtn");
  var statusEl = document.getElementById("formStatus");

  if (!form) return;

  function setHint(field, message) {
    var el = form.querySelector('[data-hint-for="' + field + '"]');
    if (el) el.textContent = message || "";
  }

  function clearHints() {
    ["name", "gender", "birth", "phone"].forEach(function (f) { setHint(f, ""); });
  }

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.className = "form-status" + (type ? " is-" + type : "");
  }

  /* ---------------- 입력값 검증 ---------------- */
  function validate(values) {
    var ok = true;
    clearHints();

    if (!values.name || values.name.trim().length < 2) {
      setHint("name", "이름을 정확히 입력해주세요.");
      ok = false;
    }
    if (!values.gender) {
      setHint("gender", "성별을 선택해주세요.");
      ok = false;
    }
    if (!/^\d{6}$/.test(values.birth)) {
      setHint("birth", "생년월 6자리를 숫자로 입력해주세요. (예: 197901)");
      ok = false;
    }
    var phoneDigits = values.phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setHint("phone", "핸드폰번호를 정확히 입력해주세요. (예: 010-1234-5678)");
      ok = false;
    }
    return ok;
  }

  /* ---------------- AES 암호화 ---------------- */
  function encrypt(text) {
    return CryptoJS.AES.encrypt(String(text), CONFIG.AES_SECRET_KEY).toString();
  }

  /* ---------------- 서버(Apps Script)로 전송 ----------------
     GAS 웹앱은 브라우저의 CORS Preflight(OPTIONS)를 처리하지 못하므로,
     text/plain 으로 보내 프리플라이트 없이 단순 요청(simple request)으로 전송합니다. */
  function sendToSheet(payload) {
    return fetch(CONFIG.GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");

    var values = {
      name: form.name.value,
      gender: form.gender.value,
      birth: form.birth.value.trim(),
      phone: form.phone.value.trim()
    };

    if (!document.getElementById("f-consent").checked) {
      setStatus("개인정보 수집 및 이용에 동의해주세요.", "error");
      return;
    }
    if (!validate(values)) {
      setStatus("입력하신 내용을 다시 확인해주세요.", "error");
      return;
    }

    if (!CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL.indexOf("여기에") !== -1) {
      setStatus("관리자 설정이 완료되지 않았습니다. (js/config.js 의 GAS_WEB_APP_URL 확인)", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("신청 정보를 안전하게 저장하는 중입니다...", "");

    var payload = {
      timestamp: new Date().toISOString(),
      name: encrypt(values.name),
      gender: encrypt(values.gender),
      birth: encrypt(values.birth),
      phone: encrypt(values.phone)
    };

    sendToSheet(payload)
      .then(function () {
        setStatus("신청이 완료되었습니다. 결제 페이지로 이동합니다...", "success");
        form.reset();
        setTimeout(function () {
          window.open(CONFIG.NAVER_STORE_URL, "_blank", "noopener");
          submitBtn.disabled = false;
          setStatus("결제 페이지가 새 창에서 열렸습니다. 결제를 완료해주세요.", "success");
        }, 900);
      })
      .catch(function (err) {
        console.error(err);
        submitBtn.disabled = false;
        setStatus("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
      });
  });

  /* 생년월 입력은 숫자만 허용 */
  var birthInput = document.getElementById("f-birth");
  if (birthInput) {
    birthInput.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
    });
  }
})();
