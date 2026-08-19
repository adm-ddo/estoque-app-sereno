import { requireSessao } from "@/lib/auth";
import FeedbackForm from "./FeedbackForm";

export default async function FeedbackPage() {
  await requireSessao();

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">
          Fale com a gente
        </h1>
        <p className="text-stone-600 mt-1 text-sm">
          Sugestão, dúvida ou crítica? Manda pra gente — sua mensagem fica
          salva aqui e vai direto pro WhatsApp do Thiago, que te responde por
          lá.
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}
