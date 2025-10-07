#!/usr/bin/env node

/**
 * 새 환경 자동 생성 스크립트
 * 구글 드라이브 폴더, 스프레드시트, Apps Script 프로젝트를 자동으로 생성합니다.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경 설정
const ENV_CONFIG = {
  envKey: 'smartbiz1',
  envName: '스마트비즈센터1',
  
  // 폴더 구조
  folders: [
    '법인관리',
    '법인관리/재무관리',
    '법인관리/재무관리/스마트비즈센터1',
    '법인관리/재무관리/스마트비즈센터1/은행거래내역'
  ],
  
  // 스프레드시트
  spreadsheet: {
    name: '법인재무관리_스마트비즈센터1',
    location: '법인관리/재무관리/스마트비즈센터1'
  }
};

console.log('🚀 스마트비즈센터1 환경 생성 시작...\n');
console.log('📋 생성할 구조:');
console.log('   폴더: 내 드라이브/' + ENV_CONFIG.folders.join('/'));
console.log('   스프레드시트: ' + ENV_CONFIG.spreadsheet.name);
console.log('');

// 사용자에게 clasp 로그인 확인
console.log('⚠️  이 스크립트는 다음을 수행합니다:');
console.log('   1. 구글 드라이브에 폴더 생성');
console.log('   2. 스프레드시트 생성');
console.log('   3. Apps Script 프로젝트 생성');
console.log('   4. 환경 설정 자동 등록');
console.log('');
console.log('계속하려면 아래 명령을 직접 실행해주세요:');
console.log('');
console.log('# 1단계: clasp으로 새 스프레드시트 프로젝트 생성');
console.log('cd actauto');
console.log('npx clasp create --type sheets --title "' + ENV_CONFIG.spreadsheet.name + '"');
console.log('');
console.log('# 생성된 스크립트 ID를 확인한 후:');
console.log('npm run env:setup');
console.log('');
console.log('환경 키: smartbiz1');
console.log('환경 이름: 스마트비즈센터1');
console.log('(나머지 정보는 프롬프트에서 입력)');

