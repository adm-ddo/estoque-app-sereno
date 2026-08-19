import { requireMaster } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FeedbackRow from "./FeedbackRow";

export default async function MasterFeedbackPage() {
  await requireMaster();

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { criadoEm: "desc" },
  });

  const naoLidos = feedbacks.filter((f) => !f.lida).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Sugestões, dúvidas e críticas
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          {naoLidos > 0
            ? `${naoLidos} ${naoLidos === 1 ? "mensagem não lida" : "mensagens não lidas"}.`
            : "Tudo em dia."}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {feedbacks.map((feedback) => (
          <FeedbackRow key={feedback.id} feedback={feedback} />
        ))}
        {feedbacks.length === 0 && (
          <p className="text-stone-500 text-sm">Nenhuma mensagem ainda.</p>
        )}
      </ul>
    </div>
  );
}
