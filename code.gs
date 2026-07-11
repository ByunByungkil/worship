/**
 * ============================================================
 * 26' 초대교회 예배여행 — 세미나 접수 백엔드 (Google Apps Script)
 * ============================================================
 * 설치 방법은 README.txt 를 참고하세요.
 *
 * 이 코드는 아래 스프레드시트에 연결됩니다:
 * https://docs.google.com/spreadsheets/d/1amITd9gMte_mbhaf_bjqu6yaXSL_5LXNo2kJq7-StxI/edit
 */

var SHEET_ID = "1amITd9gMte_mbhaf_bjqu6yaXSL_5LXNo2kJq7-StxI";
var SHEET_NAME = "접수현황"; // 스프레드시트 하단 탭 이름과 반드시 동일해야 합니다.
var HEADERS = ["접수일시", "이름(암호화)", "성별(암호화)", "생년월(암호화)", "핸드폰번호(암호화)"];

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

/* ---------------- 신청 데이터 저장 (신청 폼 -> POST) ---------------- */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.gender || "",
      data.birth || "",
      data.phone || ""
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

/* ---------------- 접수현황 조회 (관리자 페이지 -> GET) ---------------- */
function doGet(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    rows.push({
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: r[1],
      gender: r[2],
      birth: r[3],
      phone: r[4]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
