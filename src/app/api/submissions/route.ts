import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MEDIA_BUCKET = 'media';
const FIRST_WAVE_KEY = 'first_wave';

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

async function getOrCreateBadgeId() {
  const { data: existing, error: findError } = await supabaseAdmin
    .from('badges')
    .select('id')
    .eq('key', FIRST_WAVE_KEY)
    .maybeSingle();

  if (findError) {
    return null;
  }

  if (existing?.id) return existing.id;

  const { data: created, error: createError } = await supabaseAdmin
    .from('badges')
    .insert({
      key: FIRST_WAVE_KEY,
      title: 'Første bølge',
      description: 'Første innsending registrert.',
      threshold: 1,
    })
    .select('id')
    .single();

  if (createError) {
    return null;
  }

  return created.id;
}

async function awardFirstWaveBadge(userId: string) {
  const { count } = await supabaseAdmin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (!count || count < 1) return;

  const badgeId = await getOrCreateBadgeId();
  if (!badgeId) return;

  await supabaseAdmin.from('user_badges').upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      progress: 1,
      earned_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,badge_id' }
  );
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
      is_public: true,
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

    if (userId) {
      await awardFirstWaveBadge(userId);
    }

    return NextResponse.json({ id: data.id, bucket: MEDIA_BUCKET });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
