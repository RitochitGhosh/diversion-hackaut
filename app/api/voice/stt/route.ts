import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLAB_API_KEY;
  if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Forward to ElevenLabs Speech-to-Text
    const elFormData = new FormData();
    elFormData.append('file', audioFile, 'recording.webm');
    elFormData.append('model_id', 'scribe_v1');

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elFormData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[STT] ElevenLabs error:', err);
      return NextResponse.json({ error: 'Transcription failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text ?? '' });
  } catch (err) {
    console.error('[STT] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
