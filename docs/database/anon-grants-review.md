# Anonymous Grants Review

Fecha: 2026-07-03

## Hallazgo

El dump inicial `20260329230234_remote_schema.sql` contiene grants amplios
heredados para `anon`:

- `GRANT ALL ON TABLE ... TO anon`
- `GRANT ALL ON SEQUENCE ... TO anon`
- `GRANT ALL ON FUNCTION ... TO anon`
- default privileges futuros con `GRANT ALL ... TO anon`

Aunque RLS protege las tablas, esos grants amplios aumentan la superficie de
error: una tabla sin RLS, una policy demasiado amplia o una funcion expuesta por
accidente podria quedar invocable por usuarios anonimos.

## Correccion

La migracion `20260703000000_harden_anon_grants.sql` revoca los privilegios
heredados de `anon` y `PUBLIC` en el schema `public`:

- revoca permisos sobre tablas, secuencias y funciones existentes para `anon`
- mantiene solo `USAGE` de schema para `anon`, `authenticated` y `service_role`
- revoca default privileges futuros para `anon` y `PUBLIC`

## Excepciones Revisadas

Las policies de `storage.objects` creadas `TO public` para el bucket
`user-audio` se mantienen documentadas porque todas incluyen
`auth.uid() IS NOT NULL` y comparan el primer segmento del path contra el usuario
autenticado. En practica no conceden acceso a solicitudes anonimas.

## Regla De Cambio

- No agregar `GRANT ALL ... TO anon`.
- No agregar default privileges para `anon`.
- Cualquier acceso anonimo nuevo debe ser `SELECT` explicito, con RLS y una
  justificacion de producto en este documento.
