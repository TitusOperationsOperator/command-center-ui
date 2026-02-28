'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useMemories(limit = 50) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('memories')
      .select('id, category, subcategory, title, content, importance, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setData(data || []);
        setLoading(false);
      });
  }, [limit]);

  return { data, loading };
}

export function useAgentLog(limit = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('agent_log')
      .select('*')
      .order('event_time', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        // Normalize: map event_time → created_at for compatibility
        const normalized = (data || []).map((d: any) => ({
          ...d,
          created_at: d.event_time || d.created_at,
          source: d.channel || d.source || 'system',
        }));
        setData(normalized);
        setLoading(false);
      });

    const channel = supabase
      .channel('agent_log_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_log' }, (payload) => {
        const n = payload.new as any;
        setData((prev) => [{ ...n, created_at: n.event_time || n.created_at, source: n.channel || 'system' }, ...prev].slice(0, limit));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { data, loading };
}

export function useProjects() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setData(data || []);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

export function useTasks(projectId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (projectId) q = q.eq('project_id', projectId);
    q.then(({ data }) => {
      setData(data || []);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}

export function useStats() {
  const [stats, setStats] = useState({ memories: 0, logs: 0, projects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('memories').select('id', { count: 'exact', head: true }),
      supabase.from('agent_log').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
    ]).then(([m, a, p, t]) => {
      setStats({
        memories: m.count || 0,
        logs: a.count || 0,
        projects: p.count || 0,
        tasks: t.count || 0,
      });
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}

export function useApiUsage(filter: 'today' | '7d' | '30d' | 'all' = '7d') {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('api_usage')
        .select('*')
        .order('ts', { ascending: false })
        .limit(1000);

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('ts', today.toISOString());
      } else if (filter === '7d') {
        query = query.gte('ts', new Date(Date.now() - 7 * 86400000).toISOString());
      } else if (filter === '30d') {
        query = query.gte('ts', new Date(Date.now() - 30 * 86400000).toISOString());
      }

      const { data } = await query;
      setData(data || []);
      setLoading(false);
    }
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  return { data, loading };
}
