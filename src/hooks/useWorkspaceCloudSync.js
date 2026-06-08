import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasWorkspaceContent(data) {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data.products)) return data.products.length > 0;
  if (Array.isArray(data.stores)) {
    return data.stores.some((store) => Array.isArray(store.products) && store.products.length > 0);
  }
  return Object.keys(data).length > 0;
}

export function useWorkspaceCloudSync(moduleKey, localData, setLocalData) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(isSupabaseConfigured ? '未登录' : '未配置');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCloudMode, setIsCloudMode] = useState(false);
  const lastRemoteJsonRef = useRef('');
  const syncingRef = useRef(false);
  const localDataRef = useRef(localData);

  useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);

  const enabled = isSupabaseConfigured && Boolean(user);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setUser(data.session?.user || null);
      setIsCloudMode(Boolean(data.session?.user));
      setStatus(data.session?.user ? '云同步已连接' : '未登录');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setIsCloudMode(Boolean(nextSession?.user));
      setStatus(nextSession?.user ? '云同步已连接' : '未登录');
      setErrorMessage('');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      setErrorMessage('Supabase 尚未配置，无法登录。');
      return { ok: false };
    }
    setStatus('登录中');
    setErrorMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('登录失败');
      setErrorMessage(error.message);
      return { ok: false, error };
    }
    setSession(data.session || null);
    setUser(data.user || null);
    setIsCloudMode(Boolean(data.user));
    setStatus('云同步已连接');
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) {
      setErrorMessage('Supabase 尚未配置，无法注册。');
      return { ok: false };
    }
    setStatus('注册中');
    setErrorMessage('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus('注册失败');
      setErrorMessage(error.message);
      return { ok: false, error };
    }
    setSession(data.session || null);
    setUser(data.user || null);
    setIsCloudMode(Boolean(data.user));
    setStatus(data.user ? '云同步已连接' : '注册成功，请检查邮箱确认');
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsCloudMode(false);
    setStatus('未登录');
  }, []);

  const pullFromCloud = useCallback(async () => {
    if (!supabase || !user) return { ok: false };
    setStatus('正在拉取云端数据');
    setErrorMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;
    if (!currentUser) {
      setStatus('登录已失效');
      setErrorMessage('请重新登录后再同步。');
      return { ok: false };
    }

    const { data, error } = await supabase
      .from('workspace_data')
      .select('data, updated_at')
      .eq('user_id', currentUser.id)
      .eq('module_key', moduleKey)
      .maybeSingle();

    if (error) {
      setStatus('拉取失败');
      setErrorMessage(error.message);
      return { ok: false, error };
    }

    if (data?.data) {
      if (!hasWorkspaceContent(data.data) && hasWorkspaceContent(localDataRef.current)) {
        setStatus('云端为空，已保留本地数据');
        return { ok: true, data: null };
      }
      lastRemoteJsonRef.current = JSON.stringify(data.data);
      setLocalData(data.data);
      setLastSyncedAt(nowText());
      setStatus('已从云端同步');
      return { ok: true, data: data.data };
    }

    setStatus('云端暂无数据');
    return { ok: true, data: null };
  }, [moduleKey, setLocalData, user]);

  const pushToCloud = useCallback(async (nextData = localData) => {
    if (!supabase || !user) return { ok: false };
    setStatus('正在上传云端');
    setErrorMessage('');
    syncingRef.current = true;
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;
    if (!currentUser) {
      syncingRef.current = false;
      setStatus('登录已失效');
      setErrorMessage('请重新登录后再上传。');
      return { ok: false };
    }

    const payload = {
      user_id: currentUser.id,
      module_key: moduleKey,
      data: nextData,
      version: 'v1',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('workspace_data')
      .upsert(payload, { onConflict: 'user_id,module_key' });
    syncingRef.current = false;

    if (error) {
      setStatus('上传失败');
      setErrorMessage(error.message);
      return { ok: false, error };
    }

    lastRemoteJsonRef.current = JSON.stringify(nextData);
    setLastSyncedAt(nowText());
    setStatus('已同步');
    return { ok: true };
  }, [localData, moduleKey, user]);

  useEffect(() => {
    if (!enabled) return undefined;
    pullFromCloud();

    const channel = supabase
      .channel(`workspace_data:${user.id}:${moduleKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload.new;
          if (!next || next.module_key !== moduleKey || !next.data) return;
          if (!hasWorkspaceContent(next.data) && hasWorkspaceContent(localDataRef.current)) {
            setStatus('收到空云端数据，已保留本地数据');
            return;
          }
          const nextJson = JSON.stringify(next.data);
          if (syncingRef.current || nextJson === lastRemoteJsonRef.current) return;
          lastRemoteJsonRef.current = nextJson;
          setLocalData(next.data);
          setLastSyncedAt(nowText());
          setStatus('收到云端更新');
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, moduleKey, pullFromCloud, setLocalData, user]);

  useEffect(() => {
    if (!enabled || !isCloudMode) return;
    const nextJson = JSON.stringify(localData);
    if (!nextJson || nextJson === lastRemoteJsonRef.current || syncingRef.current) return;
    const timer = window.setTimeout(() => {
      if (!sameJson(localData, JSON.parse(nextJson))) return;
      pushToCloud(localData);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [enabled, isCloudMode, localData, pushToCloud]);

  return useMemo(() => ({
    configured: isSupabaseConfigured,
    enabled,
    session,
    user,
    isCloudMode,
    status,
    lastSyncedAt,
    errorMessage,
    signIn,
    signUp,
    signOut,
    pullFromCloud,
    pushToCloud,
  }), [enabled, errorMessage, isCloudMode, lastSyncedAt, pullFromCloud, pushToCloud, session, signIn, signOut, signUp, status, user]);
}