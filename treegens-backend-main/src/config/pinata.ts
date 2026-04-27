import axios from 'axios'
import FormData from 'form-data'
import env from './environment'

type PinataUploadResult = {
  videoCID: string
  publicUrl: string
}

function getPinataGatewayBaseUrl() {
  const configured = env.PINATA_GATEWAY_BASE_URL?.trim()
  if (!configured) {
    return 'https://ipfs.io/ipfs'
  }
  return configured.replace(/\/+$/, '')
}

function buildPublicUrl(videoCID: string) {
  const baseUrl = getPinataGatewayBaseUrl()
  return `${baseUrl}/${videoCID}`
}

async function uploadToPinata(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<PinataUploadResult> {
  if (!env.PINATA_JWT?.trim()) {
    throw new Error('PINATA_JWT is not configured')
  }

  const formData = new FormData()
  formData.append('file', fileBuffer, {
    filename: fileName,
    contentType: mimeType,
  })
  formData.append('network', 'public')
  formData.append('name', fileName)
  formData.append(
    'keyvalues',
    JSON.stringify({
      'uploaded-by': 'treegens-backend',
    }),
  )

  try {
    const response = await axios.post(
      'https://uploads.pinata.cloud/v3/files',
      formData,
      {
        headers: {
          Authorization: `Bearer ${env.PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 300000,
      },
    )

    const videoCID =
      response.data?.data?.cid ||
      response.data?.cid ||
      response.data?.IpfsHash ||
      null

    if (!videoCID) {
      throw new Error('Pinata upload succeeded but no CID was returned')
    }

    return {
      videoCID,
      publicUrl: buildPublicUrl(videoCID),
    }
  } catch (error: any) {
    console.error('Pinata upload error details:', {
      message: error.message,
      statusCode: error.response?.status,
      responseData: error.response?.data,
    })
    throw new Error(
      error.response?.data?.error?.details ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to upload to Pinata IPFS',
    )
  }
}

async function testPinataConnection() {
  if (!env.PINATA_JWT?.trim()) {
    return {
      connected: false,
      message: 'PINATA_JWT not configured',
    }
  }

  try {
    const response = await axios.get(
      'https://api.pinata.cloud/data/testAuthentication',
      {
        headers: {
          Authorization: `Bearer ${env.PINATA_JWT}`,
        },
        timeout: 10000,
      },
    )

    return {
      connected: response.status === 200,
      message:
        response.data?.message ||
        'Congratulations! You are communicating with the Pinata API!',
    }
  } catch (error: any) {
    return {
      connected: false,
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message,
    }
  }
}

export { buildPublicUrl, testPinataConnection, uploadToPinata }
