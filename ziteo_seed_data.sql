-- MIGRACIÓN 1: seed_products
INSERT INTO products (name, category_id, provider_id, price_unit, stock_quantity, unit_type, image_url, active, is_deleted)
VALUES
-- Provider 1: Materiales del Sur (00000003-0000-0000-0000-000000000001)
-- 7 productos (Categorías: Materiales, Eléctrico, Plomería)
('Cemento Portland 50kg', '7a175473-30a9-4dfb-8340-1b978897ad1a', '00000003-0000-0000-0000-000000000001', 9500, 200, 'bolsa', null, true, false),
('Arena fina', '7a175473-30a9-4dfb-8340-1b978897ad1a', '00000003-0000-0000-0000-000000000001', 25000, 50, 'metro', null, true, false),
('Ladrillo cerámico 12x18x33', '7a175473-30a9-4dfb-8340-1b978897ad1a', '00000003-0000-0000-0000-000000000001', 450, 5000, 'unidad', null, true, false),
('Cable unipolar 2.5mm Normalizado', '1ed9d648-c6e1-4854-a8d7-8c36f23ec785', '00000003-0000-0000-0000-000000000001', 35000, 30, 'rollo', null, true, false),
('Tubo Fluorescente / Plafón LED 18W', '1ed9d648-c6e1-4854-a8d7-8c36f23ec785', '00000003-0000-0000-0000-000000000001', 12500, 80, 'unidad', null, true, false),
('Caño PVC 110mm x 4m cloacal', '20100332-e92b-4a5b-a272-fc0575e1b8ff', '00000003-0000-0000-0000-000000000001', 8500, 150, 'unidad', null, true, false),
('Llave de paso 1/2" termofusión', '20100332-e92b-4a5b-a272-fc0575e1b8ff', '00000003-0000-0000-0000-000000000001', 4200, 100, 'unidad', null, true, false),

-- Provider 2: Ferretería Norte (00000003-0000-0000-0000-000000000002)
-- 8 productos (Categorías: Herramientas, Equipos, Seguridad)
('Taladro percutor 750W', '065eb333-9331-4792-8a61-c3064f5fdfb2', '00000003-0000-0000-0000-000000000002', 85000, 15, 'unidad', null, true, false),
('Amoladora angular 115mm', '065eb333-9331-4792-8a61-c3064f5fdfb2', '00000003-0000-0000-0000-000000000002', 62000, 20, 'unidad', null, true, false),
('Disco de corte 115mm', '065eb333-9331-4792-8a61-c3064f5fdfb2', '00000003-0000-0000-0000-000000000002', 1200, 200, 'unidad', null, true, false),
('Nivel láser luz verde', 'aff491d5-1364-4a0b-a659-6eda8d68534a', '00000003-0000-0000-0000-000000000002', 150000, 5, 'unidad', null, true, false),
('Martillo demoledor 15kg', 'aff491d5-1364-4a0b-a659-6eda8d68534a', '00000003-0000-0000-0000-000000000002', 380000, 3, 'unidad', null, true, false),
('Andamio tubular 2x1.30m', 'aff491d5-1364-4a0b-a659-6eda8d68534a', '00000003-0000-0000-0000-000000000002', 45000, 12, 'unidad', null, true, false),
('Casco de seguridad albañil', 'f2ac988d-ab9a-48b6-a382-e9e06502a4c6', '00000003-0000-0000-0000-000000000002', 5500, 50, 'unidad', null, true, false),
('Guantes de trabajo moteados', 'f2ac988d-ab9a-48b6-a382-e9e06502a4c6', '00000003-0000-0000-0000-000000000002', 1800, 150, 'par', null, true, false);

-- MIGRACIÓN 2: seed_projects
INSERT INTO projects (name, description, location_address, estimated_budget, status, needs_maestro, needs_materials, constructor_id)
VALUES
-- Proyecto 1 (Carlos Mendoza: 00000001-0000-0000-0000-000000000001)
('Ampliación Casa Central', 'Ampliación de 2 habitaciones y 1 baño en planta alta. Requiere provisión de materiales y mano de obra.', 'Av. Las Américas 123', 2500000, 'active', true, true, '00000001-0000-0000-0000-000000000001'),
-- Proyecto 2 (Carlos Mendoza: 00000001-0000-0000-0000-000000000001)
('Edificio Los Álamos - Cimientos', 'Fase inicial de cimientos para edificio de 3 pisos. Se necesitan materiales pero ya contamos con equipo.', 'Calle Sucre 456', 8500000, 'planning', false, true, '00000001-0000-0000-0000-000000000001'),
-- Proyecto 3 (Laura Gómez: 00000001-0000-0000-0000-000000000002)
('Remodelación Fachada Comercial', 'Renovación completa de fachada e iluminación exterior. Traemos materiales propios, falta maestro.', 'Av. Hernando Siles 789', 1800000, 'active', true, false, '00000001-0000-0000-0000-000000000002'),
-- Proyecto 4 (Roberto Silva: 00000001-0000-0000-0000-000000000003)
('Refacción Complejo Deportivo', 'Reparación de vestuarios y pintura general finalizada.', 'Calle Bolívar 321', 4200000, 'completed', false, false, '00000001-0000-0000-0000-000000000003');
