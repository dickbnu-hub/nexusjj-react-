import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = 'BD-Puc3bZ-hT4DnW05bdcmh5Y4mTK43_PqurndWnLP8DoNnsv6Tbhz0ZjX_hpCtw8Ey9rwRB5KXUJyW_VCNRQpg';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permissao, setPermissao] = useState(Notification.permission);
  const [inscrito, setInscrito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suportado, setSuportado] = useState(false);

  useEffect(() => {
    setSuportado('serviceWorker' in navigator && 'PushManager' in window);
    verificarInscricao();
  }, []);

  const verificarInscricao = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setInscrito(!!sub);
    } catch(e) {}
  };

  const registrarSW = async () => {
    if (!('serviceWorker' in navigator)) return null;
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    }
    return reg;
  };

  const ativarNotificacoes = async (atletaId) => {
    if (!suportado) return { ok: false, motivo: 'navegador_nao_suporta' };
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermissao(perm);
      if (perm !== 'granted') return { ok: false, motivo: 'negado' };

      const reg = await registrarSW();
      if (!reg) return { ok: false, motivo: 'sw_falhou' };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const { data: { user } } = await supabase.auth.getUser();

      // Salva no banco
      await supabase.from('push_subscriptions').upsert({
        profile_id: user?.id,
        atleta_id: atletaId || null,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'endpoint' });

      setInscrito(true);
      return { ok: true };
    } catch(e) {
      console.error('Erro ao ativar push:', e);
      return { ok: false, motivo: e.message };
    } finally {
      setLoading(false);
    }
  };

  const desativarNotificacoes = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          await sub.unsubscribe();
        }
      }
      setInscrito(false);
    } catch(e) {} finally {
      setLoading(false);
    }
  };

  return { permissao, inscrito, loading, suportado, ativarNotificacoes, desativarNotificacoes };
}
