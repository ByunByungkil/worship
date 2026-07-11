/* ============================================================
   26' 초대교회 예배여행 — 신청 폼 로직
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.SEMINAR_CONFIG || {};

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("registerForm");
    if (!form) return;

    // Enter 키로 폼이 그대로 제출되는 것을 막고 handleSubmit 으로 위임
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.handleSubmit();
    });

    var birthInput = document.getElementById("f-birth");
    if (birthInput) {
      birthInput.addEventListener("input", function () {
        this.value = this.value.replace(/[^0-9]/g, "").slice(0, 6);
      });
    }
  });

  function setHint(field, message) {
    var el = document.querySelector('[data-hint-for="' + field + '"]');
    if (el) el.textContent = message || "";
  }

  function clearHints() {
    ["name", "gender", "birth", "phone"].forEach(function (f) { setHint(f, ""); });
  }

  function setError(message, success) {
    var el = document.getElementById("form-error");
    if (!el) return;
    el.textContent = message || "";
    el.className = "form-error" + (success ? " is-success" : "");
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

  /* ---------------- 메인 제출 핸들러 ----------------
     ⚠ 팝업 차단 방지 포인트:
     새 창(window.open)은 반드시 "클릭 이벤트 안에서, 비동기 작업 이전에"
     동기적으로 열어야 브라우저가 팝업으로 차단하지 않습니다.
     fetch().then() 콜백 안에서 열면 사용자 제스처가 사라져 대부분 차단됩니다. */
  window.handleSubmit = function () {
    var form = document.getElementById("registerForm");
    var submitBtn = document.getElementById("submitBtn");
    setError("");

    var values = {
      name: form.name.value,
      gender: form.gender.value,
      birth: form.birth.value.trim(),
      phone: form.phone.value.trim()
    };

    if (!document.getElementById("f-consent").checked) {
      setError("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    if (!validate(values)) {
      setError("입력하신 내용을 다시 확인해주세요.");
      return;
    }
    if (!CONFIG.GAS_WEB_APP_URL || CONFIG.GAS_WEB_APP_URL.indexOf("여기에") !== -1) {
      setError("관리자 설정이 완료되지 않았습니다. (js/config.js 의 GAS_WEB_APP_URL 확인)");
      return;
    }

    // 1) 클릭과 동시에(동기적으로) 결제창을 미리 열어둔다 — 팝업 차단 방지 핵심.
    var paymentWindow = window.open("about:blank", "_blank");
    if (paymentWindow && paymentWindow.document) {
      paymentWindow.document.title = "결제 페이지 준비 중...";
      paymentWindow.document.body.innerHTML =
        '<p style="font-family:sans-serif;padding:40px;text-align:center;">' +
        "신청 정보를 저장하는 중입니다. 잠시만 기다려주세요...</p>";
    }

    submitBtn.disabled = true;
    setError("신청 정보를 안전하게 저장하는 중입니다...", true);

    var payload = {
      timestamp: new Date().toISOString(),
      name: encrypt(values.name),
      gender: encrypt(values.gender),
      birth: encrypt(values.birth),
      phone: encrypt(values.phone)
    };

    sendToSheet(payload)
      .then(function () {
        // 2) 저장 성공 후, 미리 열어둔 창의 주소만 결제 페이지로 이동시킨다.
        if (paymentWindow) {
          paymentWindow.location.href = CONFIG.NAVER_STORE_URL;
        } else {
          // 팝업이 차단되었을 경우를 대비한 대체 동선(현재 탭에서 이동)
          window.location.href = CONFIG.NAVER_STORE_URL;
        }
        form.reset();
        submitBtn.disabled = false;
        setError("신청이 완료되었습니다. 결제 페이지에서 결제를 진행해주세요.", true);
      })
      .catch(function (err) {
        console.error(err);
        if (paymentWindow) paymentWindow.close();
        submitBtn.disabled = false;
        setError("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      });
  };
})();
