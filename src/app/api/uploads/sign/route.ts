import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MEDIA_BUCKET = 'media';
const SIGNED_UPLOAD_TTL_SECONDS = 60 * 10;

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const body = await req.json();
    const path = body?.path;
    const contentType = body?.contentType;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path, SIGNED_UPLOAD_TTL_SECONDS);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      path,
      uploadUrl: data?.signedUrl ?? null,
      token: data?.token ?? null,
      contentType: contentType || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
