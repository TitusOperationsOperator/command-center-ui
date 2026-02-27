import { supabase } from './supabase';

// Send a message through the chat system
// Messages are stored in Supabase and agents poll for new messages
export async function sendChatMessage(threadId: string, content: string, agentName = 'Cody') {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      agent_name: agentName,
      content,
      metadata: { source: 'command-center', timestamp: new Date().toISOString() },
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  // Update thread timestamp
  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId);

  return data;
}

// Get system health stats
export async function getSystemHealth() {
  const start = Date.now();
  const { count: memCount } = await supabase.from('memories').select('id', { count: 'exact', head: true });
  const pingMs = Date.now() - start;

  const { count: logCount } = await supabase.from('agent_log').select('id', { count: 'exact', head: true });
  const { count: threadCount } = await supabase.from('chat_threads').select('id', { count: 'exact', head: true });
  const { count: msgCount } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true });
  const { count: fileCount } = await supabase.from('file_uploads').select('id', { count: 'exact', head: true });
  const { data: buckets } = await supabase.storage.listBuckets();

  return {
    supabasePingMs: pingMs,
    supabaseStatus: pingMs < 2000 ? 'healthy' : 'degraded',
    memories: memCount || 0,
    agentLogs: logCount || 0,
    chatThreads: threadCount || 0,
    chatMessages: msgCount || 0,
    fileUploads: fileCount || 0,
    storageBuckets: buckets?.length || 0,
  };
}

// Get recent agent activity summary
export async function getAgentSummary() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recentLogs } = await supabase
    .from('agent_log')
    .select('source, action, created_at')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false });

  const agents: Record<string, { lastActive: string; actions24h: number }> = {};

  for (const log of recentLogs || []) {
    const src = (log.source || 'system').toLowerCase();
    if (!agents[src]) {
      agents[src] = { lastActive: log.created_at, actions24h: 0 };
    }
    agents[src].actions24h++;
  }

  return agents;
}
