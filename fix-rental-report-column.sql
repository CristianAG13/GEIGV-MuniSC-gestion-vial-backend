-- Script para cambiar el nombre de la columna operadorId a instructorIngenieroId
-- en la tabla rental_reports (reportes de alquiler)
-- 
-- IMPORTANTE: Esta columna ahora hace referencia a la tabla 'users' (id del ingeniero/inspector)
-- NO a la tabla 'operators'. Las boletas municipales siguen usando 'operators'.

-- Renombrar la columna operadorId a instructorIngenieroId
ALTER TABLE rental_reports 
RENAME COLUMN "operadorId" TO "instructorIngenieroId";

-- Verificar el cambio
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rental_reports'
AND column_name = 'instructorIngenieroId';

-- Nota: La foreign key (si existe) debe apuntar a users.id, no a operators.id
-- Si necesitas agregar/actualizar la foreign key:
-- 
-- ALTER TABLE rental_reports 
-- DROP CONSTRAINT IF EXISTS fk_rental_reports_operator;
-- 
-- ALTER TABLE rental_reports 
-- ADD CONSTRAINT fk_rental_reports_instructor_ingeniero 
-- FOREIGN KEY ("instructorIngenieroId") 
-- REFERENCES users(id) 
-- ON DELETE SET NULL;
