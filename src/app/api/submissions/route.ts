import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MEDIA_BUCKET = 'media';

function roundCoord(value: number, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

async function getUserIdFromAuthHeader(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const userId = await getUserIdFromAuthHeader(authHeader);

    const body = await req.json();

    const level = Number(body.level);
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const mediaType = body.media_type;
    const mediaPath = body.media_path_original;

    if (![1, 2].includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    if (!['photo', 'video'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }
    if (!mediaPath || typeof mediaPath !== 'string') {
      return NextResponse.json({ error: 'Missing media_path_original' }, { status: 400 });
    }

    const submission = {
      user_id: userId,
      display_name: body.display_name || null,
      level,
      comment: body.comment || null,
      valg: body.valg || null,
      wind_dir: body.wind_dir || null,
      wave_dir: body.wave_dir || null,
      video_duration: body.video_duration || null,
      video_analysis: body.video_analysis || null,
      lat,
      lng,
      lat_public: roundCoord(lat, 4),
      lng_public: roundCoord(lng, 4),
      location_method: body.location_method || null,
      accuracy: body.accuracy || null,
      media_type: mediaType,
      media_path_original: mediaPath,
      media_path_preview: body.media_path_preview || null,
      media_content_type: body.media_content_type || null,
      media_size_bytes: body.media_size_bytes || null,
      is_public: !!userId,
      deleted_at: null,
    };

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert(submission)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id, bucket: MEDIA_BUCKET });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
