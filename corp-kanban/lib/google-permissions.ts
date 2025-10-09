/**
 * Google Drive/Sheets 권한 관리
 */

import { google } from 'googleapis'

// Google Service Account 인증 클라이언트 생성
function getAuthClient() {
  // Service Account 사용 (서버 간 인증)
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Google Service Account credentials are not configured')
  }

  const jwt = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  )

  return jwt
}

interface PermissionOptions {
  role?: 'reader' | 'writer' | 'commenter'
  sendNotification?: boolean
}

/**
 * 파일/폴더에 권한 부여
 */
export async function grantPermission(
  fileId: string,
  email: string,
  options: PermissionOptions = {}
) {
  const auth = getAuthClient()
  const drive = google.drive({ version: 'v3', auth })

  const { role = 'writer', sendNotification = true } = options

  try {
    const response = await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: email
      },
      sendNotificationEmail: sendNotification,
      fields: 'id'
    })

    return {
      success: true,
      permissionId: response.data.id
    }
  } catch (error) {
    console.error(`Failed to grant permission to ${email} for ${fileId}:`, error)
    throw error
  }
}

/**
 * 파일/폴더에서 권한 제거
 */
export async function revokePermission(
  fileId: string,
  permissionId: string
) {
  const auth = getAuthClient()
  const drive = google.drive({ version: 'v3', auth })

  try {
    await drive.permissions.delete({
      fileId,
      permissionId
    })

    return { success: true }
  } catch (error) {
    console.error(`Failed to revoke permission ${permissionId} from ${fileId}:`, error)
    throw error
  }
}

/**
 * 파일/폴더의 모든 권한 목록 조회
 */
export async function listPermissions(fileId: string) {
  const auth = getAuthClient()
  const drive = google.drive({ version: 'v3', auth })

  try {
    const response = await drive.permissions.list({
      fileId,
      fields: 'permissions(id,emailAddress,role,type)'
    })

    return response.data.permissions || []
  } catch (error) {
    console.error(`Failed to list permissions for ${fileId}:`, error)
    throw error
  }
}

/**
 * 특정 이메일의 권한 찾기
 */
export async function findPermissionByEmail(fileId: string, email: string) {
  const permissions = await listPermissions(fileId)
  return permissions.find(p => p.emailAddress === email)
}

/**
 * 법인의 폴더와 스프레드시트에 권한 부여
 */
export async function grantCorporationAccess(
  folderId: string,
  spreadsheetId: string,
  emails: string[],
  options: PermissionOptions = {}
) {
  const results = []

  for (const email of emails) {
    try {
      // 폴더 권한 부여
      const folderResult = await grantPermission(folderId, email, options)

      // 스프레드시트 권한 부여
      const sheetResult = await grantPermission(spreadsheetId, email, options)

      results.push({
        email,
        success: true,
        folderPermissionId: folderResult.permissionId,
        sheetPermissionId: sheetResult.permissionId
      })
    } catch (error) {
      results.push({
        email,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

/**
 * 법인의 폴더와 스프레드시트에서 권한 제거
 */
export async function revokeCorporationAccess(
  folderId: string,
  spreadsheetId: string,
  email: string
) {
  try {
    // 폴더에서 권한 찾기 및 제거
    const folderPermission = await findPermissionByEmail(folderId, email)
    if (folderPermission?.id) {
      await revokePermission(folderId, folderPermission.id)
    }

    // 스프레드시트에서 권한 찾기 및 제거
    const sheetPermission = await findPermissionByEmail(spreadsheetId, email)
    if (sheetPermission?.id) {
      await revokePermission(spreadsheetId, sheetPermission.id)
    }

    return { success: true }
  } catch (error) {
    console.error(`Failed to revoke access for ${email}:`, error)
    throw error
  }
}

/**
 * 여러 법인에 대해 일괄 권한 부여
 */
export async function grantBulkAccess(
  corporations: Array<{ folderId: string; spreadsheetId: string; name: string }>,
  emails: string[],
  options: PermissionOptions = {}
) {
  const results = []

  for (const corp of corporations) {
    const corpResults = await grantCorporationAccess(
      corp.folderId,
      corp.spreadsheetId,
      emails,
      options
    )

    results.push({
      corporationName: corp.name,
      results: corpResults
    })
  }

  return results
}
