import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MEDIA_BUCKET = 'media';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(
        [
          'id',
          'level',
          'media_type',
          'media_path_original',
          'created_at',
          'lat_public',
          'lng_public',
          'display_name',
          'comment',
          'valg',
          'wind_dir',
          'wave_dir',
          'video_duration',
          'video_analysis',
        ].join(',')
      )
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const results = await Promise.all(
      (data || []).map(async (row) => {
        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(MEDIA_BUCKET)
          .createSignedUrl(row.media_path_original, SIGNED_URL_TTL_SECONDS);

        return {
          ...row,
          media_url: signedError ? null : signed?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ data: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
