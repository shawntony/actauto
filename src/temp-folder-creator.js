
function createFolderStructure() {
  // 폴더 구조: 법인관리 > 재무관리 > 스마트비즈센터1 > 은행거래내역
  
  // 1단계: 법인관리 폴더 찾기 또는 생성
  var rootFolders = DriveApp.getFoldersByName('법인관리');
  var 법인관리;
  
  if (rootFolders.hasNext()) {
    법인관리 = rootFolders.next();
    Logger.log('기존 "법인관리" 폴더 사용: ' + 법인관리.getId());
  } else {
    법인관리 = DriveApp.createFolder('법인관리');
    Logger.log('새 "법인관리" 폴더 생성: ' + 법인관리.getId());
  }
  
  // 2단계: 재무관리 폴더
  var 재무관리Folders = 법인관리.getFoldersByName('재무관리');
  var 재무관리;
  
  if (재무관리Folders.hasNext()) {
    재무관리 = 재무관리Folders.next();
    Logger.log('기존 "재무관리" 폴더 사용: ' + 재무관리.getId());
  } else {
    재무관리 = 법인관리.createFolder('재무관리');
    Logger.log('새 "재무관리" 폴더 생성: ' + 재무관리.getId());
  }
  
  // 3단계: 스마트비즈센터1 폴더
  var 스마트비즈센터1Folders = 재무관리.getFoldersByName('스마트비즈센터1');
  var 스마트비즈센터1;
  
  if (스마트비즈센터1Folders.hasNext()) {
    스마트비즈센터1 = 스마트비즈센터1Folders.next();
    Logger.log('기존 "스마트비즈센터1" 폴더 사용: ' + 스마트비즈센터1.getId());
  } else {
    스마트비즈센터1 = 재무관리.createFolder('스마트비즈센터1');
    Logger.log('새 "스마트비즈센터1" 폴더 생성: ' + 스마트비즈센터1.getId());
  }
  
  // 4단계: 은행거래내역 폴더
  var 은행거래내역Folders = 스마트비즈센터1.getFoldersByName('은행거래내역');
  var 은행거래내역;
  
  if (은행거래내역Folders.hasNext()) {
    은행거래내역 = 은행거래내역Folders.next();
    Logger.log('기존 "은행거래내역" 폴더 사용: ' + 은행거래내역.getId());
  } else {
    은행거래내역 = 스마트비즈센터1.createFolder('은행거래내역');
    Logger.log('새 "은행거래내역" 폴더 생성: ' + 은행거래내역.getId());
  }
  
  // 5단계: 스프레드시트를 스마트비즈센터1 폴더로 이동
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var file = DriveApp.getFileById(spreadsheet.getId());
  
  // 현재 부모 폴더들 제거
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    parent.removeFile(file);
  }
  
  // 새 위치로 이동
  스마트비즈센터1.addFile(file);
  Logger.log('스프레드시트를 "스마트비즈센터1" 폴더로 이동 완료');
  
  // 결과 반환
  return {
    법인관리Id: 법인관리.getId(),
    재무관리Id: 재무관리.getId(),
    스마트비즈센터1Id: 스마트비즈센터1.getId(),
    은행거래내역Id: 은행거래내역.getId(),
    스프레드시트Id: spreadsheet.getId()
  };
}
