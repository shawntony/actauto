/**
 * Google Drive 유틸리티
 *
 * Drive 파일 및 폴더 작업을 위한 헬퍼 함수 제공
 * - 폴더 관리
 * - 파일 검색
 * - 파일 복사/이동
 * - 공유 설정
 *
 * @module DriveUtils
 */

const DriveUtils = {
  /**
   * 폴더 존재 여부 확인 및 가져오기
   * @param {GoogleAppsScript.Drive.Folder} parentFolder - 부모 폴더
   * @param {string} folderName - 폴더 이름
   * @returns {GoogleAppsScript.Drive.Folder|null} 폴더 객체 (없으면 null)
   * @example
   * const folder = DriveUtils.getFolderByName(DriveApp.getRootFolder(), '법인관리');
   */
  getFolderByName(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);
    return folders.hasNext() ? folders.next() : null;
  },

  /**
   * 폴더 가져오기 또는 생성
   * @param {GoogleAppsScript.Drive.Folder} parentFolder - 부모 폴더
   * @param {string} folderName - 폴더 이름
   * @returns {GoogleAppsScript.Drive.Folder} 폴더 객체
   * @example
   * const folder = DriveUtils.getOrCreateFolder(DriveApp.getRootFolder(), '재무관리');
   */
  getOrCreateFolder(parentFolder, folderName) {
    let folder = this.getFolderByName(parentFolder, folderName);
    if (!folder) {
      folder = parentFolder.createFolder(folderName);
      Logger.log(`폴더 생성: ${folderName}`);
    }
    return folder;
  },

  /**
   * 경로로 폴더 생성 (중첩 폴더 자동 생성)
   * @param {string} path - 폴더 경로 (슬래시로 구분, 예: "법인관리/재무관리/유니스")
   * @param {GoogleAppsScript.Drive.Folder} [rootFolder] - 루트 폴더 (기본값: My Drive)
   * @returns {GoogleAppsScript.Drive.Folder} 최종 폴더 객체
   * @example
   * const folder = DriveUtils.createFolderPath('법인관리/재무관리/유니스');
   */
  createFolderPath(path, rootFolder) {
    let currentFolder = rootFolder || DriveApp.getRootFolder();
    const folderNames = path.split('/').filter(name => name.trim());

    folderNames.forEach(folderName => {
      currentFolder = this.getOrCreateFolder(currentFolder, folderName);
    });

    return currentFolder;
  },

  /**
   * 파일 검색 (이름으로)
   * @param {GoogleAppsScript.Drive.Folder} folder - 검색할 폴더
   * @param {string} fileName - 파일 이름
   * @returns {GoogleAppsScript.Drive.File|null} 파일 객체 (없으면 null)
   * @example
   * const file = DriveUtils.getFileByName(folder, '법인재무관리_유니스');
   */
  getFileByName(folder, fileName) {
    const files = folder.getFilesByName(fileName);
    return files.hasNext() ? files.next() : null;
  },

  /**
   * 스프레드시트 파일 검색 및 열기
   * @param {GoogleAppsScript.Drive.Folder} folder - 검색할 폴더
   * @param {string} fileName - 스프레드시트 이름
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet|null} 스프레드시트 객체 (없으면 null)
   * @example
   * const ss = DriveUtils.getSpreadsheetByName(folder, '법인재무관리_유니스');
   */
  getSpreadsheetByName(folder, fileName) {
    const file = this.getFileByName(folder, fileName);
    if (!file) return null;

    try {
      return SpreadsheetApp.openById(file.getId());
    } catch (e) {
      Logger.log(`스프레드시트 열기 실패: ${e.message}`);
      return null;
    }
  },

  /**
   * 파일 복사
   * @param {GoogleAppsScript.Drive.File} file - 복사할 파일
   * @param {GoogleAppsScript.Drive.Folder} targetFolder - 대상 폴더
   * @param {string} [newName] - 새 이름 (선택)
   * @returns {GoogleAppsScript.Drive.File} 복사된 파일
   * @example
   * const copy = DriveUtils.copyFile(originalFile, targetFolder, '복사본_파일명');
   */
  copyFile(file, targetFolder, newName) {
    const copiedFile = file.makeCopy(newName || file.getName(), targetFolder);
    Logger.log(`파일 복사: ${file.getName()} → ${copiedFile.getName()}`);
    return copiedFile;
  },

  /**
   * 파일 이동
   * @param {GoogleAppsScript.Drive.File} file - 이동할 파일
   * @param {GoogleAppsScript.Drive.Folder} targetFolder - 대상 폴더
   * @returns {GoogleAppsScript.Drive.File} 이동된 파일
   * @example
   * DriveUtils.moveFile(file, targetFolder);
   */
  moveFile(file, targetFolder) {
    // 현재 부모 폴더들 제거
    const parents = file.getParents();
    while (parents.hasNext()) {
      file.removeFrom(parents.next());
    }

    // 새 폴더에 추가
    targetFolder.addFile(file);
    Logger.log(`파일 이동: ${file.getName()} → ${targetFolder.getName()}`);
    return file;
  },

  /**
   * 파일 삭제 (휴지통으로)
   * @param {GoogleAppsScript.Drive.File} file - 삭제할 파일
   * @example
   * DriveUtils.trashFile(tempFile);
   */
  trashFile(file) {
    file.setTrashed(true);
    Logger.log(`파일 삭제 (휴지통): ${file.getName()}`);
  },

  /**
   * 폴더 삭제 (휴지통으로)
   * @param {GoogleAppsScript.Drive.Folder} folder - 삭제할 폴더
   * @example
   * DriveUtils.trashFolder(tempFolder);
   */
  trashFolder(folder) {
    folder.setTrashed(true);
    Logger.log(`폴더 삭제 (휴지통): ${folder.getName()}`);
  },

  /**
   * 폴더 내 모든 파일 목록 가져오기
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @param {boolean} [recursive=false] - 하위 폴더 포함 여부
   * @returns {Array<GoogleAppsScript.Drive.File>} 파일 배열
   * @example
   * const files = DriveUtils.listFiles(folder, true);
   * files.forEach(file => Logger.log(file.getName()));
   */
  listFiles(folder, recursive = false) {
    const files = [];
    const fileIterator = folder.getFiles();

    while (fileIterator.hasNext()) {
      files.push(fileIterator.next());
    }

    if (recursive) {
      const folderIterator = folder.getFolders();
      while (folderIterator.hasNext()) {
        const subFolder = folderIterator.next();
        files.push(...this.listFiles(subFolder, true));
      }
    }

    return files;
  },

  /**
   * 폴더 내 스프레드시트 목록 가져오기
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @returns {Array<GoogleAppsScript.Drive.File>} 스프레드시트 파일 배열
   * @example
   * const sheets = DriveUtils.listSpreadsheets(folder);
   */
  listSpreadsheets(folder) {
    const spreadsheets = [];
    const files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);

    while (files.hasNext()) {
      spreadsheets.push(files.next());
    }

    return spreadsheets;
  },

  /**
   * 파일 공유 설정 (편집자 추가)
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @param {string} email - 공유할 이메일
   * @param {boolean} [sendNotification=false] - 알림 이메일 발송 여부
   * @example
   * DriveUtils.shareWithEditor(file, 'user@example.com', true);
   */
  shareWithEditor(file, email, sendNotification = false) {
    file.addEditor(email);
    if (sendNotification) {
      Logger.log(`파일 공유 (편집자): ${file.getName()} → ${email}`);
    }
  },

  /**
   * 파일 공유 설정 (뷰어 추가)
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @param {string} email - 공유할 이메일
   * @param {boolean} [sendNotification=false] - 알림 이메일 발송 여부
   * @example
   * DriveUtils.shareWithViewer(file, 'viewer@example.com');
   */
  shareWithViewer(file, email, sendNotification = false) {
    file.addViewer(email);
    if (sendNotification) {
      Logger.log(`파일 공유 (뷰어): ${file.getName()} → ${email}`);
    }
  },

  /**
   * 폴더 공유 설정 (편집자 추가)
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @param {string} email - 공유할 이메일
   * @example
   * DriveUtils.shareFolderWithEditor(folder, 'user@example.com');
   */
  shareFolderWithEditor(folder, email) {
    folder.addEditor(email);
    Logger.log(`폴더 공유 (편집자): ${folder.getName()} → ${email}`);
  },

  /**
   * 파일 URL 가져오기
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {string} 파일 URL
   * @example
   * const url = DriveUtils.getFileUrl(file);
   */
  getFileUrl(file) {
    return file.getUrl();
  },

  /**
   * 폴더 URL 가져오기
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @returns {string} 폴더 URL
   * @example
   * const url = DriveUtils.getFolderUrl(folder);
   */
  getFolderUrl(folder) {
    return folder.getUrl();
  },

  /**
   * 파일 크기 가져오기 (바이트)
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {number} 파일 크기 (바이트)
   * @example
   * const size = DriveUtils.getFileSize(file);
   * Logger.log(`파일 크기: ${(size / 1024 / 1024).toFixed(2)} MB`);
   */
  getFileSize(file) {
    return file.getSize();
  },

  /**
   * 파일 최종 수정 날짜 가져오기
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {Date} 최종 수정 날짜
   * @example
   * const lastModified = DriveUtils.getLastModified(file);
   */
  getLastModified(file) {
    return file.getLastUpdated();
  },

  /**
   * 파일 이름 변경
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @param {string} newName - 새 이름
   * @returns {GoogleAppsScript.Drive.File} 파일
   * @example
   * DriveUtils.renameFile(file, '새로운_파일명');
   */
  renameFile(file, newName) {
    const oldName = file.getName();
    file.setName(newName);
    Logger.log(`파일 이름 변경: ${oldName} → ${newName}`);
    return file;
  },

  /**
   * 폴더 이름 변경
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @param {string} newName - 새 이름
   * @returns {GoogleAppsScript.Drive.Folder} 폴더
   * @example
   * DriveUtils.renameFolder(folder, '새로운_폴더명');
   */
  renameFolder(folder, newName) {
    const oldName = folder.getName();
    folder.setName(newName);
    Logger.log(`폴더 이름 변경: ${oldName} → ${newName}`);
    return folder;
  },

  /**
   * 파일 MIME 타입 가져오기
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {string} MIME 타입
   * @example
   * const mimeType = DriveUtils.getMimeType(file);
   */
  getMimeType(file) {
    return file.getMimeType();
  },

  /**
   * 파일이 스프레드시트인지 확인
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {boolean} 스프레드시트이면 true
   * @example
   * if (DriveUtils.isSpreadsheet(file)) {
   *   const ss = SpreadsheetApp.openById(file.getId());
   * }
   */
  isSpreadsheet(file) {
    return file.getMimeType() === MimeType.GOOGLE_SHEETS;
  },

  /**
   * 파일이 문서인지 확인
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @returns {boolean} 문서이면 true
   * @example
   * if (DriveUtils.isDocument(file)) {
   *   const doc = DocumentApp.openById(file.getId());
   * }
   */
  isDocument(file) {
    return file.getMimeType() === MimeType.GOOGLE_DOCS;
  },

  /**
   * ID로 파일 가져오기 (안전)
   * @param {string} fileId - 파일 ID
   * @returns {GoogleAppsScript.Drive.File|null} 파일 객체 (없거나 오류 시 null)
   * @example
   * const file = DriveUtils.getFileById('1RFpK_S04ZSIOPxhmpjhJjKZuQlBDFhmTQ5gwJpjYJG8');
   */
  getFileById(fileId) {
    try {
      return DriveApp.getFileById(fileId);
    } catch (e) {
      Logger.log(`파일 가져오기 실패 (ID: ${fileId}): ${e.message}`);
      return null;
    }
  },

  /**
   * ID로 폴더 가져오기 (안전)
   * @param {string} folderId - 폴더 ID
   * @returns {GoogleAppsScript.Drive.Folder|null} 폴더 객체 (없거나 오류 시 null)
   * @example
   * const folder = DriveUtils.getFolderById('1ABC...');
   */
  getFolderById(folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      Logger.log(`폴더 가져오기 실패 (ID: ${folderId}): ${e.message}`);
      return null;
    }
  },

  /**
   * 파일 설명 설정
   * @param {GoogleAppsScript.Drive.File} file - 파일
   * @param {string} description - 설명
   * @example
   * DriveUtils.setFileDescription(file, '이 파일은 2024년 재무 데이터입니다.');
   */
  setFileDescription(file, description) {
    file.setDescription(description);
  },

  /**
   * 폴더 설명 설정
   * @param {GoogleAppsScript.Drive.Folder} folder - 폴더
   * @param {string} description - 설명
   * @example
   * DriveUtils.setFolderDescription(folder, '법인 재무관리 자료 보관 폴더');
   */
  setFolderDescription(folder, description) {
    folder.setDescription(description);
  },

  /**
   * 임시 파일 정리 (n일 이상 된 파일 삭제)
   * @param {GoogleAppsScript.Drive.Folder} folder - 정리할 폴더
   * @param {number} daysOld - 보관 일수
   * @returns {number} 삭제된 파일 수
   * @example
   * const deleted = DriveUtils.cleanupOldFiles(tempFolder, 7); // 7일 이상된 파일 삭제
   */
  cleanupOldFiles(folder, daysOld) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;
    const files = folder.getFiles();

    while (files.hasNext()) {
      const file = files.next();
      if (file.getLastUpdated() < cutoffDate) {
        this.trashFile(file);
        deletedCount++;
      }
    }

    Logger.log(`${daysOld}일 이상된 파일 ${deletedCount}개 삭제 (폴더: ${folder.getName()})`);
    return deletedCount;
  }
};
