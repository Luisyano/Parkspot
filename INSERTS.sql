USE parkspot;

-- ==========================================
-- 1. NUEVA SEDE: SURCO (si no existe)
-- ==========================================
INSERT IGNORE INTO sede (nombre, direccion, distrito, hora_apertura, hora_cierre) VALUES
('ParkSpot Surco', 'Av. Caminos del Inca 456', 'Surco', '06:00:00', '22:00:00');

SET @sede_id = (SELECT id FROM sede WHERE nombre = 'ParkSpot Surco' LIMIT 1);

-- Insertar piso solo si no existe
INSERT IGNORE INTO piso (sede_id, numero, letra) VALUES (@sede_id, 1, 'A');

SET @piso_id = (SELECT id FROM piso WHERE sede_id = @sede_id AND numero = 1 LIMIT 1);

-- Insertar espacios (si ya existen, se ignoran)
INSERT IGNORE INTO espacio (piso_id, sede_id, codigo, tipo, estado) VALUES
(@piso_id, @sede_id, 'A-01', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-02', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-03', 'DISCAPACITADO', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-04', 'REGULAR', 'OCUPADO'),
(@piso_id, @sede_id, 'A-05', 'MOTO', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-06', 'REGULAR', 'DISPONIBLE');

-- ==========================================
-- 2. NUEVA SEDE: SAN BORJA
-- ==========================================
INSERT IGNORE INTO sede (nombre, direccion, distrito, hora_apertura, hora_cierre) VALUES
('ParkSpot San Borja', 'Av. Javier Prado 789', 'San Borja', '06:00:00', '23:00:00');

SET @sede_id = (SELECT id FROM sede WHERE nombre = 'ParkSpot San Borja' LIMIT 1);

INSERT IGNORE INTO piso (sede_id, numero, letra) VALUES (@sede_id, 1, 'A');

SET @piso_id = (SELECT id FROM piso WHERE sede_id = @sede_id AND numero = 1 LIMIT 1);

INSERT IGNORE INTO espacio (piso_id, sede_id, codigo, tipo, estado) VALUES
(@piso_id, @sede_id, 'A-01', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-02', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-03', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-04', 'DISCAPACITADO', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-05', 'REGULAR', 'OCUPADO'),
(@piso_id, @sede_id, 'A-06', 'MOTO', 'DISPONIBLE');

-- ==========================================
-- 3. NUEVA SEDE: PUEBLO LIBRE
-- ==========================================
INSERT IGNORE INTO sede (nombre, direccion, distrito, hora_apertura, hora_cierre) VALUES
('ParkSpot Pueblo Libre', 'Av. Sucre 321', 'Pueblo Libre', '07:00:00', '21:00:00');

SET @sede_id = (SELECT id FROM sede WHERE nombre = 'ParkSpot Pueblo Libre' LIMIT 1);

INSERT IGNORE INTO piso (sede_id, numero, letra) VALUES (@sede_id, 1, 'A');

SET @piso_id = (SELECT id FROM piso WHERE sede_id = @sede_id AND numero = 1 LIMIT 1);

INSERT IGNORE INTO espacio (piso_id, sede_id, codigo, tipo, estado) VALUES
(@piso_id, @sede_id, 'A-01', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-02', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-03', 'DISCAPACITADO', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-04', 'REGULAR', 'OCUPADO'),
(@piso_id, @sede_id, 'A-05', 'REGULAR', 'DISPONIBLE');

-- ==========================================
-- 4. NUEVA SEDE: JESÚS MARÍA
-- ==========================================
INSERT IGNORE INTO sede (nombre, direccion, distrito, hora_apertura, hora_cierre) VALUES
('ParkSpot Jesús María', 'Av. Brasil 555', 'Jesús María', '06:00:00', '22:00:00');

SET @sede_id = (SELECT id FROM sede WHERE nombre = 'ParkSpot Jesús María' LIMIT 1);

INSERT IGNORE INTO piso (sede_id, numero, letra) VALUES (@sede_id, 1, 'A');

SET @piso_id = (SELECT id FROM piso WHERE sede_id = @sede_id AND numero = 1 LIMIT 1);

INSERT IGNORE INTO espacio (piso_id, sede_id, codigo, tipo, estado) VALUES
(@piso_id, @sede_id, 'A-01', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-02', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-03', 'REGULAR', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-04', 'DISCAPACITADO', 'DISPONIBLE'),
(@piso_id, @sede_id, 'A-05', 'MOTO', 'DISPONIBLE');




INSERT INTO incidente (
    espacio_id, 
    operador_id, 
    tipo, 
    descripcion, 
    estado
) VALUES (
    1,                      -- espacio A-01
    1,                      -- ID del operador que reporta
    'ABANDONADO',
    'Vehículo abandonado por más de 2 horas en el espacio A-01',
    'ABIERTO'
);