// src/app/api/sales/health/route.ts
import { NextResponse } from 'next/server'
import { getHealthStatus } from '@/lib/sales/monitoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const health = getHealthStatus()
    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', timestamp: new Date().toISOString(), error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
