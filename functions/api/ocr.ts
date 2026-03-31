interface Env {
  GOOGLE_VISION_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { image } = (await request.json()) as { image: string };

    // Extract base64 data from data URI
    const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '');

    // Call Google Cloud Vision API for handwriting detection
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${env.GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      return Response.json(
        { error: `Vision API error: ${response.status} — ${errBody.slice(0, 200)}`, rawText: '', tasks: [] },
        { status: 500 }
      );
    }

    const result = (await response.json()) as any;
    const annotation = result.responses?.[0];

    if (annotation?.error) {
      return Response.json(
        { error: `Vision API: ${annotation.error.message}`, rawText: '', tasks: [] },
        { status: 500 }
      );
    }

    const rawText = annotation?.fullTextAnnotation?.text || '';

    if (!rawText || rawText.length < 2) {
      return Response.json({
        rawText: '',
        tasks: [],
        error: 'No text detected. Try a clearer photo or type tasks manually.',
      });
    }

    // Parse into task candidates
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const tasks = lines
      .map((line: string) => {
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
