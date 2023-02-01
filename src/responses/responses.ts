export const apiSuccess = (data: any): Response => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-type': 'application/json',
  }

  const body = JSON.stringify({ success: true, data })

  const res = new Response(body, { headers })

  return res
}

export const apiError = (error: string, statusError: number): Response => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-type': 'application/json',
  }

  const body = JSON.stringify({ success: false, error })

  const res = new Response(body, { headers, status: statusError })

  return res
}
