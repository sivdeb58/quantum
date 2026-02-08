/**
 * PATCH /api/followers/stop-copy-trading
 * Stop or resume copy trading for a specific follower (Admin/Master only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { followerId, action } = body; // action: 'stop' or 'resume'

    // Validate inputs
    if (!followerId) {
      return NextResponse.json(
        { ok: false, message: 'followerId is required' },
        { status: 400 }
      );
    }

    if (!action || !['stop', 'resume'].includes(action)) {
      return NextResponse.json(
        { ok: false, message: 'action must be either "stop" or "resume"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const isActive = action === 'resume';
    const masterInfo = req.headers.get('x-master-id') || 'admin';

    if (action === 'stop') {
      // Stop copy trading
      await db.query(
        `
        UPDATE follower_consents 
        SET copy_trading_active = FALSE, 
            copy_trading_stopped_at = NOW(),
            copy_trading_stopped_by = ?
        WHERE follower_id = ?
        `,
        [masterInfo, followerId]
      );
    } else {
      // Resume copy trading
      await db.query(
        `
        UPDATE follower_consents 
        SET copy_trading_active = TRUE, 
            copy_trading_stopped_at = NULL,
            copy_trading_stopped_by = NULL
        WHERE follower_id = ?
        `,
        [followerId]
      );
    }

    // Get updated consent record
    const rows = await db.query(
      `SELECT * FROM follower_consents WHERE follower_id = ?`,
      [followerId]
    ) as Array<any>;

    const consent = rows[0];

    return NextResponse.json({
      ok: true,
      message: `Copy trading ${action === 'stop' ? 'stopped' : 'resumed'} for ${followerId}`,
      consent: consent ? {
        follower_id: consent.follower_id,
        enabled: consent.trade_replication_enabled,
        copyTradingActive: consent.copy_trading_active,
        stoppedAt: consent.copy_trading_stopped_at,
        stoppedBy: consent.copy_trading_stopped_by,
      } : null,
    });
  } catch (error: any) {
    console.error('Stop/Resume copy trading error:', error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/followers/stop-copy-trading
 * Check copy trading status for a follower
 */
export async function GET(req: NextRequest) {
  try {
    const followerId = req.nextUrl.searchParams.get('followerId');

    if (!followerId) {
      return NextResponse.json(
        { ok: false, message: 'followerId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const rows = await db.query(
      `SELECT copy_trading_active, copy_trading_stopped_at, copy_trading_stopped_by FROM follower_consents WHERE follower_id = ?`,
      [followerId]
    ) as Array<any>;

    const consent = rows[0];

    return NextResponse.json({
      ok: true,
      copyTradingActive: consent?.copy_trading_active ?? true,
      stoppedAt: consent?.copy_trading_stopped_at,
      stoppedBy: consent?.copy_trading_stopped_by,
    });
  } catch (error: any) {
    console.error('Get copy trading status error:', error);
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
}
