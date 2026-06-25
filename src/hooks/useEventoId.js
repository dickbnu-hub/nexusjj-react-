import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Resolve tanto UUID quanto número curto para o UUID real
export function useEventoId() {
  const params = useParams();
  const rawId = params.id || params.numero;
  const [eventoId, setEventoId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawId) return;
    // Se parece UUID (tem hífens), usa direto
    if (rawId.includes('-')) {
      setEventoId(rawId);
      setLoading(false);
      return;
    }
    // Senão busca pelo número
    supabase.from('eventos').select('id').eq('numero', parseInt(rawId)).single()
      .then(({ data }) => {
        if (data) setEventoId(data.id);
        setLoading(false);
      });
  }, [rawId]);

  return { eventoId, loading };
}
