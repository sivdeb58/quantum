import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const appCode = process.env.ALICE_APP_CODE;
  if (!appCode) {
    return NextResponse.json({ ok: false, message: 'ALICE_APP_CODE not configured' }, { status: 500 });
  }

  const redirectUrl = `https://ant.aliceblueonline.com/?appcode=${encodeURIComponent(appCode)}`;

  const res = NextResponse.redirect(redirectUrl);
  return res;
}
