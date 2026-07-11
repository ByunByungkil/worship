/* ============================================================
   설정 파일 — 배포 전 반드시 아래 값을 채워주세요.
   자세한 설명은 README.txt 를 참고하세요.
   ============================================================ */
window.SEMINAR_CONFIG = {

  // 1) Google Apps Script 웹앱 배포 URL
  //    (code.gs 를 스프레드시트에 붙여넣고 "웹 앱으로 배포" 한 뒤 나오는 URL)
  //    예: "https://script.google.com/macros/s/AKfycbxxxxxxxx/exec"
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbyPRBPA1YvYWNXOCbcSvw6GnX1gLAjDvONrHxPXWwQaA8NQTpPqCRiOOV3fQWhmWdJSzg/exec/exec",

  // 2) 신청자 개인정보 암호화에 쓰이는 비밀키 (AES).
  //    admin.js 의 키와 반드시 동일해야 복호화됩니다.
  //    실제 운영 전 반드시 원하는 값으로 변경하세요.
  AES_SECRET_KEY: "dreamnanum-2026-실제운영키-fuzzy38",

  // 3) 결제(네이버 스마트스토어) 링크
  //    ⚠ 현재 값은 "판매자 상품 수정" 페이지 링크입니다.
  //    고객이 실제로 결제할 수 있는 "상품 상세/구매" 페이지 URL로 교체해주세요.
  NAVER_STORE_URL: "https://sell.smartstore.naver.com/#/products/edit/11841462813",

  // 4) 관리자 페이지 접속 비밀번호의 SHA-256 해시값.
  //    기본 비밀번호는 "dream2026" 입니다. 반드시 변경 후 사용하세요.
  //    변경 방법: 브라우저 콘솔에서
  //      CryptoJS.SHA256("새비밀번호").toString()
  //    을 실행해 나온 값을 아래에 붙여넣으면 됩니다.
  ADMIN_PASSWORD_HASH: "6941434a907d5dfac4d407e58ca75214e3931902b1d73c7d6e6e0bf3d2e10d75"
};
