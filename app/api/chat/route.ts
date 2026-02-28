import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const gatewayUrl = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
const gatewayToken = process.env.GATEWAY_TOKEN!;

// Create a Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, message, agentName = 'Cody', stream = true } = body;

    if (!threadId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: threadId, message' },
        { status: 400 }
      );
    }

    // 1. Write user message to Supabase
    const { data: userMessage, error: userError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        agent_name: agentName,
        content: message,
        metadata: { source: 'command-center-api', timestamp: new Date().toISOString() },
      })
      .select()
      .maybeSingle();

    if (userError) {
      console.error('Error writing user message:', userError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Update thread timestamp
    await supabaseAdmin
      .from('chat_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    // 2. Call OpenClaw gateway
    if (!stream) {
      // Non-streaming mode (fallback)
      let aiResponse = '';
      try {
        const gatewayRes = await fetch(`${gatewayUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${gatewayToken}`,
          },
          body: JSON.stringify({
            model: 'anthropic/claude-sonnet-4-5',
            messages: [{ role: 'user', content: message }],
            stream: false,
          }),
        });

        if (!gatewayRes.ok) {
          console.error('Gateway error:', gatewayRes.statusText);
          return NextResponse.json(
            { error: 'Gateway unavailable', userMessage },
            { status: 503 }
          );
        }

        const gatewayData = await gatewayRes.json();
        aiResponse = gatewayData.choices?.[0]?.message?.content || '';

        // 3. Write AI response to Supabase
        if (aiResponse) {
          const { error: aiError } = await supabaseAdmin
            .from('chat_messages')
            .insert({
              thread_id: threadId,
              agent_name: 'Titus',
              content: aiResponse,
              metadata: { source: 'gateway', timestamp: new Date().toISOString() },
            });

          if (aiError) {
            console.error('Error writing AI response:', aiError);
          }

          await supabaseAdmin
            .from('chat_threads')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', threadId);
        }

        return NextResponse.json({
          success: true,
          userMessage,
          aiResponse,
        });
      } catch (gatewayError) {
        console.error('Gateway call failed:', gatewayError);
        return NextResponse.json(
          { error: 'Gateway call failed', userMessage },
          { status: 503 }
        );
      }
    }

    // Streaming mode
    const encoder = new TextEncoder();
    let fullResponse = '';

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          const gatewayRes = await fetch(`${gatewayUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${gatewayToken}`,
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4-5',
              messages: [{ role: 'user', content: message }],
              stream: true,
            }),
          });

          if (!gatewayRes.ok) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'Gateway unavailable' })}\n\n`)
            );
            controller.close();
            return;
          }

          const reader = gatewayRes.body?.getReader();
          if (!reader) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'No stream available' })}\n\n`)
            );
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }

          // Write complete response to Supabase
          if (fullResponse) {
            await supabaseAdmin.from('chat_messages').insert({
              thread_id: threadId,
              agent_name: 'Titus',
              content: fullResponse,
              metadata: { source: 'gateway-stream', timestamp: new Date().toISOString() },
            });

            await supabaseAdmin
              .from('chat_threads')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', threadId);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
