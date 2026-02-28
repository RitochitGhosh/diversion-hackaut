import { NextRequest, NextResponse } from 'next/server';

// Rachel — natural, clear English voice
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLAB_API_KEY;
  if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 503 });
  }

  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Strip markdown and cap at 5000 chars (ElevenLabs limit)
          text: text.replace(/[#*`_~\[\]]/g, '').slice(0, 5000),
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[TTS] ElevenLabs error:', err);
      return NextResponse.json({ error: 'Speech synthesis failed' }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error('[TTS] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
