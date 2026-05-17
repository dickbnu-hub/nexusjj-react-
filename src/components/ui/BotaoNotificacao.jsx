import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function BotaoNotificacao({ atletaId }) {
  const { permissao, inscrito, loading, suportado, ativarNotificacoes, desativarNotificacoes } = usePushNotifications();

  if (!suportado) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-slate-400 text-xs">
        Seu navegador não suporta notificações push.
      </div>
    );
  }

  if (permissao === 'denied') {
    return (
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-orange-400 text-xs">
        Notificações bloqueadas. Habilite nas configurações do navegador.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => inscrito ? desativarNotificacoes() : ativarNotificacoes(atletaId)}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
          inscrito
            ? 'bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-400'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : inscrito ? (
          <>🔔 Notificações ativas — clique para desativar</>
        ) : (
          <>🔕 Ativar notificações de luta</>
        )}
      </button>
      {inscrito && (
        <p className="text-slate-500 text-xs text-center">
          Você será avisado 10 min antes da sua luta começar.
        </p>
      )}
      {!inscrito && (
        <p className="text-slate-500 text-xs text-center">
          Receba aviso no celular quando sua luta estiver próxima.
          {' '}<span className="text-slate-600">iPhone: use Safari e adicione à tela inicial.</span>
        </p>
      )}
    </div>
  );
}
