import { NextRequest, NextResponse } from "next/server";

const GATE_COOKIE_NAME = "nvc_gate";

// Ścieżki dostępne BEZ przejścia przez bramkę: sam ekran bramki, jego
// route handler, oraz zasoby statyczne Next.js.
const PUBLIC_PREFIXES = [
  "/gate",
  "/api/gate",
  "/auth/callback", // link z maila Supabase — user trafia tu przed bramką
  "/_next",
  "/favicon.ico",
];

// Next.js 16 zmienił konwencję middleware.ts -> proxy.ts (sama nazwa pliku
// i eksportowanej funkcji; logika bez zmian). Sprawdzanie samego cookie
// (bez ciężkich operacji jak zapytania do bazy) jest zgodne z zalecanym
// użyciem tej warstwy — to nadal tylko bramka hasłem, nie pełna autoryzacja
// (ta dzieje się w AuthGuard po stronie klienta i w FastAPI per-request).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(GATE_COOKIE_NAME)?.value;
  const expected = process.env.GATE_TOKEN;

  if (!expected) {
    // Brak skonfigurowanego sekretu na serwerze — to błąd configu, nie
    // usera. Wolimy zablokować dostęp niż przepuścić wszystkich.
    console.error("GATE_TOKEN nie jest ustawiony w env aplikacji frontowej.");
  }

  if (!cookieValue || !expected || cookieValue !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = "/gate";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
