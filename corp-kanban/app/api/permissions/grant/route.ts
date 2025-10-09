/**
 * 권한 부여 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { grantBulkAccess, grantCorporationAccess } from '@/lib/google-permissions'
import { fetchCorporations } from '@/lib/sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scope, emails, corporationIds, role = 'writer', sendNotification = true } = body

    // 입력 검증
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: '이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `잘못된 이메일 형식: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    const options = { role, sendNotification }

    if (scope === 'all') {
      // 전체 법인에 권한 부여
      const allCorporations = await fetchCorporations()

      const corporationsData = allCorporations.map(corp => ({
        folderId: corp.folderId,
        spreadsheetId: corp.spreadsheetId,
        name: corp.name
      }))

      const results = await grantBulkAccess(corporationsData, emails, options)

      return NextResponse.json({
        success: true,
        message: `${emails.length}개 이메일을 ${allCorporations.length}개 법인에 추가했습니다.`,
        results
      })
    } else if (scope === 'selected') {
      // 선택된 법인에만 권한 부여
      if (!corporationIds || !Array.isArray(corporationIds) || corporationIds.length === 0) {
        return NextResponse.json(
          { success: false, error: '법인을 선택해주세요.' },
          { status: 400 }
        )
      }

      const allCorporations = await fetchCorporations()
      const selectedCorporations = allCorporations.filter(corp =>
        corporationIds.includes(corp.id)
      )

      if (selectedCorporations.length === 0) {
        return NextResponse.json(
          { success: false, error: '선택된 법인을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      const corporationsData = selectedCorporations.map(corp => ({
        folderId: corp.folderId,
        spreadsheetId: corp.spreadsheetId,
        name: corp.name
      }))

      const results = await grantBulkAccess(corporationsData, emails, options)

      return NextResponse.json({
        success: true,
        message: `${emails.length}개 이메일을 ${selectedCorporations.length}개 법인에 추가했습니다.`,
        results
      })
    } else if (scope === 'single') {
      // 단일 법인에 권한 부여 (법인 카드에서 호출)
      const { folderId, spreadsheetId } = body

      if (!folderId || !spreadsheetId) {
        return NextResponse.json(
          { success: false, error: '폴더 ID와 스프레드시트 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      const results = await grantCorporationAccess(
        folderId,
        spreadsheetId,
        emails,
        options
      )

      return NextResponse.json({
        success: true,
        message: `${emails.length}개 이메일에 권한을 부여했습니다.`,
        results
      })
    } else {
      return NextResponse.json(
        { success: false, error: '올바른 scope를 지정해주세요. (all, selected, single)' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Permission grant error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '권한 부여에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
