export class SupabaseConfigError extends Error {
  constructor() {
    super("Supabase nao configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    this.name = "SupabaseConfigError";
  }
}

export class SupabaseRestError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = "SupabaseRestError";
    this.status = status;
    this.details = details;
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new SupabaseConfigError();
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object") {
    const maybeMessage = "message" in payload ? payload.message : null;
    const maybeError = "error" in payload ? payload.error : null;

    if (typeof maybeMessage === "string") return maybeMessage;
    if (typeof maybeError === "string") return maybeError;
  }

  return "Erro ao acessar o banco de dados.";
}

export async function supabaseRest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new SupabaseRestError(response.status, getErrorMessage(payload), payload);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export function supabaseRpc<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  return supabaseRest<T>(`rpc/${functionName}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
