interface Env {
  AI: Ai;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { image } = await request.json() as { image: string };

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Use Cloudflare Workers AI vision model to extract text
    const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this handwritten notebook page. List each item on its own line. If items appear to be tasks or to-do items, preserve them as-is. Include any checkboxes, bullets, dashes, or numbering. Return ONLY the extracted text, nothing else.'
            },
            {
              type: 'image',
              image: [...imageBytes],
            }
          ]
        }
      ],
      max_tokens: 1024,
    });

    const rawText = (response as any).response || '';

    // Parse extracted text into task candidates
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const tasks = lines.map((line: string) => {
      const trimmed = line.trim()
        .replace(/^[\-\*\•\✓\✗\☐\☑\[\]\(\)x\d+\.\)]+\s*/i, '') // Remove bullets, checkboxes, numbers
        .trim();

      if (!trimmed) return null;

      // Infer category from keywords
      let category = 'work';
      let priority = 'medium';

      const lower = trimmed.toLowerCase();

      // Must-win indicators
      if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') ||
          lower.includes('!!!') || lower.includes('important') || lower.includes('deadline') ||
          lower.includes('must') || lower.includes('priority')) {
        category = 'must-win';
        priority = 'high';
      }
      // Personal indicators
      else if (lower.includes('gym') || lower.includes('doctor') || lower.includes('dentist') ||
               lower.includes('grocery') || lower.includes('pickup') || lower.includes('pick up') ||
               lower.includes('call mom') || lower.includes('call dad') || lower.includes('laundry') ||
               lower.includes('cook') || lower.includes('clean') || lower.includes('personal') ||
               lower.includes('appointment') || lower.includes('haircut') || lower.includes('errand')) {
        category = 'personal';
        priority = 'low';
      }
      // Follow-up indicators
      else if (lower.includes('follow up') || lower.includes('waiting') || lower.includes('check on') ||
               lower.includes('remind') || lower.includes('ask about') || lower.includes('ping') ||
               lower.includes('check in') || lower.includes('status')) {
        category = 'follow-up';
        priority = 'medium';
      }

      return { title: trimmed, category, priority };
    }).filter(Boolean);

    return Response.json({ rawText, tasks });
  } catch (error: any) {
    // If Workers AI is not available, return a helpful error
    return Response.json(
      { error: 'OCR processing failed. ' + (error?.message || 'Unknown error'), rawText: '', tasks: [] },
      { status: 500 }
    );
  }
};
