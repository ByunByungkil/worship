/* ============================================================
   26' 초대교회 예배여행 — 신청 폼 로직
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.SEMINAR_CONFIG || {};

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("registerForm");
    if (!form) return;

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

  /* 입력값 검증 */
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

  /* AES 암호화 */
  function encrypt(text) {
    return CryptoJS.AES.encrypt(String(text), CONFIG.AES_SECRET_KEY).toString();
  }

  /* 서버로 전송 */
  function sendToSheet(payload) {
    return fetch(CONFIG.GAS_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }

  /* 메인 제출 핸들러 */
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
        form.reset();
        submitBtn.disabled = false;
        
        // 신청 완료 후 결제 방식 선택
        var choice = confirm(
          "신청이 완료되었습니다.\n\n" +
          "[확인] 네이버 스마트스토어에서 카드 결제하기\n" +
          "[취소] 계좌로 입금하기"
        );

        if (choice) {
          // 네이버 스마트스토어 결제
          setError("결제 페이지로 이동합니다.", true);
          window.open(CONFIG.NAVER_STORE_URL, "_blank", "noopener");
        } else {
          // 계좌 입금 안내
          var accountInfo = document.getElementById("accountInfo");
          if (accountInfo) {
            accountInfo.style.display = "block";
            accountInfo.scrollIntoView({ behavior: "smooth" });
          }
          setError("아래 계좌 정보로 입금해주세요.", true);
        }
      })
      .catch(function (err) {
        console.error(err);
        submitBtn.disabled = false;
        setError("전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      });
  };
})();
