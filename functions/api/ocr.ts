interface Env {
  ANTHROPIC_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { image } = (await request.json()) as { image: string };

    // Extract base64 and media type from data URI
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) {
      return Response.json(
        { error: 'Invalid image format. Expected data URI.', rawText: '', tasks: [] },
        { status: 400 }
      );
    }
    const mediaType = match[1];
    const base64Data = match[2];

    // Call Claude API with vision
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: 'Read this photo of my handwritten notebook page. Transcribe every line of text exactly as written, one item per line. These are tasks and to-do items. Output ONLY the transcribed text — no commentary, no descriptions, no formatting. Just the raw text, one task per line.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return Response.json(
        { error: `Claude API error: ${response.status} — ${errBody.slice(0, 200)}`, rawText: '', tasks: [] },
        { status: 500 }
      );
    }

    const result = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    const rawText =
      result.content
        ?.filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n') || '';

    if (!rawText || rawText.length < 3) {
      return Response.json({
        rawText: '',
        tasks: [],
        error: 'No text detected. Try a clearer photo or type tasks manually.',
      });
    }

    // Parse into task candidates
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const tasks = lines
      .map((line) => {
        const trimmed = line
          .trim()
          .replace(/^[\-\*\•\✓\✗\☐\☑\[\]\(\)x\d+\.\)]+\s*/i, '')
          .trim();
        if (!trimmed || trimmed.length < 2) return null;

        let category = 'work';
        let priority = 'medium';
        const lower = trimmed.toLowerCase();

        if (/urgent|asap|critical|important|deadline|must win|priority/i.test(lower)) {
          category = 'must-win';
          priority = 'high';
        } else if (/gym|doctor|dentist|grocery|pick\s?up|laundry|cook|clean|personal|appointment|haircut|errand/i.test(lower)) {
          category = 'personal';
          priority = 'low';
        } else if (/follow\s?up|waiting|check\s?on|remind|ask\s?about|ping|check\s?in|status/i.test(lower)) {
          category = 'follow-up';
          priority = 'medium';
        }

        return { title: trimmed, category, priority };
      })
      .filter(Boolean);

    return Response.json({ rawText, tasks });
  } catch (error: any) {
    return Response.json(
      { error: 'OCR failed: ' + (error?.message || String(error)), rawText: '', tasks: [] },
      { status: 500 }
    );
  }
};
