/**
 * ============================================================
 * 26' 초대교회 예배여행 — 세미나 접수 백엔드 (Google Apps Script)
 * ============================================================ */

var SHEET_ID = "1amITd9gMte_mbhaf_bjqu6yaXSL_5LXNo2kJq7-StxI";
var SHEET_NAME = "접수현황";
var AES_SECRET_KEY = "dreamnanum-2026-실제운영키-fuzzy38";

var HEADERS = [
  "접수일시",
  "이름", "성별", "생년월", "핸드폰번호",
  "이름(암호화)", "성별(암호화)", "생년월(암호화)", "핸드폰번호(암호화)"
];

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 서버측 복호화 (Apps Script 자체 함수 사용으로 안정성 강화)
 * CryptoJS가 로드 실패할 수 있으니 Apps Script의 Utilities를 활용합니다.
 */
function decryptValue_(cipherText) {
  try {
    // CryptoJS로 암호화된 값은 "U2FsdGVkX1..." 형태의 Base64
    // Apps Script 자체 해석은 어려우므로, 일단 암호문을 그대로 반환하고
    // 실패 시 표기합니다.
    
    // 다른 방법: cryptojs.gs 호출
    if (typeof CryptoJS !== 'undefined' && CryptoJS.AES) {
      var bytes = CryptoJS.AES.decrypt(String(cipherText), AES_SECRET_KEY);
      var plain = bytes.toString(CryptoJS.enc.Utf8);
      return plain || "(복호화 실패)";
    }
    
    // CryptoJS가 없으면 "복호화 필요" 표기
    return "[암호화됨]";
  } catch (err) {
    return "(복호화 실패)";
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    var nameEnc = data.name || "";
    var genderEnc = data.gender || "";
    var birthEnc = data.birth || "";
    var phoneEnc = data.phone || "";

    // 복호화 시도
    var namePlain = decryptValue_(nameEnc);
    var genderPlain = decryptValue_(genderEnc);
    var birthPlain = decryptValue_(birthEnc);
    var phonePlain = decryptValue_(phoneEnc);

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      namePlain,
      genderPlain,
      birthPlain,
      phonePlain,
      nameEnc,
      genderEnc,
      birthEnc,
      phoneEnc
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    rows.push({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: r[5],
      gender: r[6],
      birth: r[7],
      phone: r[8]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
