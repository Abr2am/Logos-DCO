#!/usr/bin/env bash
#
# Applique les migrations sur une base jetable, puis exécute les tests de
# schéma et de sécurité.
#
#   DATABASE_URL=postgres://... ./scripts/verify-schema.sh
#
# La doublure `supabase/tests/00_shim.sql` reproduit ce que Supabase fournit
# (rôles, schémas auth et storage). Elle n'est jamais appliquée en production.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL est requis}"

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --quiet --no-psqlrc)

echo "→ doublure Supabase"
"${PSQL[@]}" -f supabase/tests/00_shim.sql

echo "→ migrations"
for migration in supabase/migrations/*.sql; do
  echo "   $(basename "$migration")"
  "${PSQL[@]}" -f "$migration"
done

echo "→ tests"
for test in supabase/tests/[1-9]*.sql; do
  echo "   $(basename "$test")"
  "${PSQL[@]}" -f "$test"
done

echo "✓ schéma vérifié"
