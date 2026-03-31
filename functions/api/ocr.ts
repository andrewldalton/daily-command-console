interface Env {
  AI: Ai;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { image } = (await request.json()) as { image: string };

    // Ensure we have a proper data URI
    let dataUri = image;
    if (!dataUri.startsWith('data:image/')) {
      dataUri = `data:image/png;base64,${image}`;
    }

    // Use OpenAI-compatible format with image_url containing data URI
    // This is the confirmed working format for Workers AI vision
    const response: any = await env.AI.run(
      '@cf/meta/llama-3.2-11b-vision-instruct' as BaseAiTextGenerationModels,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert handwriting transcription assistant. You specialize in reading handwritten notebook pages, to-do lists, and task lists. You are very accurate at deciphering cursive and messy handwriting. Always do your best to read every word, even if partially legible. Output each task or item on its own line. Never add tasks that are not in the image. Never describe the image — only transcribe the text you see.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Read this photo of my handwritten notebook page carefully. Transcribe every line of text you can see, one item per line. These are my tasks and to-do items for the day. Read each word carefully — my handwriting may be messy but try your best. Output ONLY the transcribed text, nothing else. Do not add commentary or descriptions.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        max_tokens: 1024,
      } as any
    );

    const rawText = (response as any)?.response || '';

    if (!rawText || rawText.length < 3) {
      return Response.json({
        rawText: '',
        tasks: [],
        error: 'No text detected in image. Try a clearer photo or type tasks manually.',
      });
    }

    // Parse text into task candidates
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const tasks = lines
      .map((line: string) => {
        const trimmed = line
          .trim()
          .replace(/^[\-\*\•\✓\✗\☐\☑\[\]\(\)x\d+\.\)]+\s*/i, '')
          .trim();
        if (!trimmed || trimmed.length < 3) return null;

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
    const msg = error?.message || String(error);

    // License agreement flow
    if (msg.includes('5016') || msg.includes('agree')) {
      try {
        await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct' as any, {
          prompt: 'agree',
          max_tokens: 5,
        } as any);
      } catch {
        // May throw but still accept
      }
      return Response.json(
        { error: 'Model license accepted. Please try again.', rawText: '', tasks: [] },
        { status: 503 }
      );
    }

    return Response.json(
      { error: 'OCR failed: ' + msg, rawText: '', tasks: [] },
      { status: 500 }
    );
  }
};
