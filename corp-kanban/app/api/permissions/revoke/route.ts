/**
 * 권한 제거 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { revokeCorporationAccess } from '@/lib/google-permissions'
import { fetchCorporations } from '@/lib/sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scope, email, corporationIds, folderId, spreadsheetId } = body

    // 입력 검증
    if (!email) {
      return NextResponse.json(
        { success: false, error: '이메일 주소를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (scope === 'all') {
      // 모든 법인에서 권한 제거
      const allCorporations = await fetchCorporations()
      const results = []

      for (const corp of allCorporations) {
        try {
          await revokeCorporationAccess(
            corp.folderId,
            corp.spreadsheetId,
            email
          )
          results.push({ corporationName: corp.name, success: true })
        } catch (error) {
          results.push({
            corporationName: corp.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `${email}의 권한을 모든 법인에서 제거했습니다.`,
        results
      })
    } else if (scope === 'selected') {
      // 선택된 법인에서만 권한 제거
      if (!corporationIds || !Array.isArray(corporationIds)) {
        return NextResponse.json(
          { success: false, error: '법인을 선택해주세요.' },
          { status: 400 }
        )
      }

      const allCorporations = await fetchCorporations()
      const selectedCorporations = allCorporations.filter(corp =>
        corporationIds.includes(corp.id)
      )

      const results = []

      for (const corp of selectedCorporations) {
        try {
          await revokeCorporationAccess(
            corp.folderId,
            corp.spreadsheetId,
            email
          )
          results.push({ corporationName: corp.name, success: true })
        } catch (error) {
          results.push({
            corporationName: corp.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `${email}의 권한을 선택한 법인에서 제거했습니다.`,
        results
      })
    } else if (scope === 'single') {
      // 단일 법인에서 권한 제거
      if (!folderId || !spreadsheetId) {
        return NextResponse.json(
          { success: false, error: '폴더 ID와 스프레드시트 ID가 필요합니다.' },
          { status: 400 }
        )
      }

      await revokeCorporationAccess(folderId, spreadsheetId, email)

      return NextResponse.json({
        success: true,
        message: `${email}의 권한을 제거했습니다.`
      })
    } else {
      return NextResponse.json(
        { success: false, error: '올바른 scope를 지정해주세요. (all, selected, single)' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Permission revoke error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '권한 제거에 실패했습니다.'
      },
      { status: 500 }
    )
  }
}
