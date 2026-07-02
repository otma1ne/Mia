import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.text()
  const params = new URLSearchParams(body)
  const socketId    = params.get('socket_id')    ?? ''
  const channelName = params.get('channel_name') ?? ''

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName)
    return NextResponse.json(authResponse)
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 })
  }
}
