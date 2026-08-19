export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Validação leve de formato (11 dígitos), sem checar dígito verificador —
 * mesmo nível de validação já usado pro documento de fornecedor. */
export function cpfValido(cpf: string): boolean {
  return apenasDigitos(cpf).length === 11;
}

export type FornecedorComparavel = {
  id: number;
  nome: string;
  documento: string;
  telefone: string | null;
};

export function encontrarFornecedoresDuplicados<T extends FornecedorComparavel>(
  documento: string,
  telefone: string,
  existentes: T[]
): T[] {
  const docNovo = apenasDigitos(documento);
  const telNovo = apenasDigitos(telefone);
  return existentes.filter((f) => {
    const docMatch = docNovo.length > 0 && apenasDigitos(f.documento) === docNovo;
    const telMatch =
      telNovo.length > 0 && !!f.telefone && apenasDigitos(f.telefone) === telNovo;
    return docMatch || telMatch;
  });
}
