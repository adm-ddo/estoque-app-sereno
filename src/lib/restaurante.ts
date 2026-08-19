import { randomBytes } from "node:crypto";

const MAX_LOGO_BYTES = 1_500_000; // ~1.5MB

/** Token longo e aleatório usado no link público de contagem
 * (/c/[token]/...). Não é sequencial nem adivinhável — funciona como uma
 * senha de acesso a esse restaurante, então deve ser tratado como tal. */
export function gerarTokenContagem(): string {
  return randomBytes(24).toString("base64url");
}

export type DadosRestauranteState = { erro?: string } | undefined;

export type DadosRestaurante = {
  nome: string;
  cnpj: string;
  endereco: string;
  logo: string | null;
};

/** Lê e valida os campos comuns de restaurante (usado no /cadastro e em
 * /empresas ao adicionar uma nova empresa a um login já existente). */
export async function lerDadosRestaurante(
  formData: FormData
): Promise<{ erro: string } | { dados: DadosRestaurante }> {
  const nome = String(formData.get("nome") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const logoFile = formData.get("logo");

  if (!nome || !cnpj || !endereco) {
    return { erro: "Preencha nome, CNPJ e endereço." };
  }

  let logo: string | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_BYTES) {
      return { erro: "A logo deve ter no máximo 1,5MB." };
    }
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logo = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
  }

  return { dados: { nome, cnpj, endereco, logo } };
}
