import { getMessages } from '@/app/actions/messages'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params
  const result = await getMessages(partnerId)

  if (result.error) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  })
}
