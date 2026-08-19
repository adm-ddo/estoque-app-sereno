// Sem informar o fuso, o Intl.DateTimeFormat usa o fuso do servidor — em
// produção (Vercel) isso é UTC, deixando toda data/hora exibida 3h à frente
// do horário real de Brasília. Fixando o fuso aqui garante o horário certo
// não importa onde o código rode.
const FUSO_HORARIO_BRASIL = "America/Sao_Paulo";

export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO_HORARIO_BRASIL,
  }).format(data);
}

export function formatarDataCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: FUSO_HORARIO_BRASIL,
  }).format(data);
}

export function formatarHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
    timeZone: FUSO_HORARIO_BRASIL,
  }).format(data);
}

/** Meia-noite de "hoje" em Brasília, como instante UTC — usado pra
 * consultas tipo "contagens feitas hoje". O Brasil não tem mais horário de
 * verão desde 2019, então São Paulo fica sempre em UTC-3: meia-noite lá é
 * sempre 03:00 UTC do mesmo dia. */
export function inicioDoDiaBrasil(instante: Date): Date {
  const dataISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO_BRASIL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instante);
  return new Date(`${dataISO}T03:00:00.000Z`);
}

/** Meia-noite da segunda-feira desta semana em Brasília — usado pra somar
 * compras/consumo "desta semana". */
export function inicioDaSemanaBrasil(instante: Date): Date {
  const inicioHoje = inicioDoDiaBrasil(instante);
  const diaSemana = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_HORARIO_BRASIL,
    weekday: "short",
  }).format(instante);
  const indicePorDia: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  // Quantos dias se passaram desde a última segunda-feira (segunda = 0).
  const diasDesdeSegunda = (indicePorDia[diaSemana] + 6) % 7;
  return new Date(inicioHoje.getTime() - diasDesdeSegunda * 24 * 60 * 60 * 1000);
}

/** Meia-noite do dia 1 deste mês em Brasília — usado pra somar
 * compras/consumo "deste mês". */
export function inicioDoMesBrasil(instante: Date): Date {
  const anoMes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_HORARIO_BRASIL,
    year: "numeric",
    month: "2-digit",
  }).format(instante);
  return new Date(`${anoMes}-01T03:00:00.000Z`);
}
