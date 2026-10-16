-- ============================================================
-- PARKSPOT — BASE DE DATOS (versión simplificada) — v2
-- Desarrollo de Aplicaciones Web I — Spring Boot + Angular
-- ============================================================
-- Decisión de diseño clave: los catálogos fijos (roles, estados,
-- tipos, métodos de pago) se modelan como ENUM directamente en la
-- columna, no como tablas aparte. Esto evita el problema del
-- proyecto anterior (muchas tablas catálogo = muchos JOIN para
-- leer y muchos IDs que buscar antes de poder insertar).
-- Solo se separan en tabla propia las entidades que SÍ tienen
-- datos propios más allá de un nombre (sede, plan, etc.)
-- ============================================================
-- CAMBIOS v1 → v2 (tras revisión en equipo):
--   1. Se agregó `sede_id` directo en `espacio`, además de
--      `piso_id`. Es redundante (se puede derivar de piso.sede_id),
--      pero evita 2 JOINs en la consulta más frecuente del sistema:
--      "espacios disponibles en la sede X". Desnormalización
--      intencional, no un error de diseño.
--   2. Se agregó 'PLIN' al ENUM de método de pago (ya estaba
--      contemplado en la UI de pago y faltaba en la BD).
--
-- Se evaluó y DESCARTÓ a propósito:
--   - Precio de plan por sede: el negocio define planes globales,
--     no por sede. No se agrega sede_id a `plan`.
--   - Vista `usuario_con_deuda`: no aporta nada que no dé un
--     SELECT SUM(...) directo desde el backend. Capa extra sin
--     beneficio real para este tamaño de proyecto.
--   - Trigger que bloquee reservas con deuda pendiente: esa regla
--     de negocio vive en el backend (ReservaService), nunca en
--     SQL. Un trigger sería lógica escondida difícil de rastrear.
-- ============================================================

CREATE DATABASE IF NOT EXISTS parkspot;
USE parkspot;

-- ============================================================
-- 1. SEDE
-- Se crea antes que Usuario porque un Operador (tabla usuario)
-- referencia a la sede a la que está asignado.
-- ============================================================
CREATE TABLE sede (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    direccion       VARCHAR(200) NOT NULL,
    distrito        VARCHAR(80) NOT NULL,
    hora_apertura   TIME NOT NULL DEFAULT '06:00:00',
    hora_cierre     TIME NOT NULL DEFAULT '23:00:00',
    estado          ENUM('ACTIVA','PAUSADA','INACTIVA') NOT NULL DEFAULT 'ACTIVA'
);

-- ============================================================
-- 2. USUARIO
-- Incluye Cliente, Operador y Administrador con el mismo modelo.
-- Un Operador es un usuario con rol='OPERADOR' y sede_id asignada.
-- Los datos de CONADIS viven aquí porque la verificación es única
-- por usuario (no por reserva), tal como se definió.
-- ============================================================
CREATE TABLE usuario (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombres                     VARCHAR(100) NOT NULL,
    apellidos                   VARCHAR(100) NOT NULL,
    email                       VARCHAR(150) NOT NULL UNIQUE,
    password                    VARCHAR(255) NOT NULL,
    celular                     VARCHAR(20),
    rol                         ENUM('CLIENTE','OPERADOR','ADMIN') NOT NULL DEFAULT 'CLIENTE',
    sede_id                     BIGINT NULL,                          -- solo aplica si rol = OPERADOR
    conadis_verificado          BOOLEAN NOT NULL DEFAULT FALSE,
    conadis_imagen_url          VARCHAR(255) NULL,
    conadis_fecha_expiracion    DATE NULL,
    tiene_tarjeta_guardada      BOOLEAN NOT NULL DEFAULT FALSE,        -- simula si hay método de cobro automático
    fecha_creacion              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_sede FOREIGN KEY (sede_id) REFERENCES sede(id)
);

-- ============================================================
-- 3. PISO
-- ============================================================
CREATE TABLE piso (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    sede_id     BIGINT NOT NULL,
    numero      INT NOT NULL,
    letra       CHAR(1) NOT NULL,             -- 'A', 'B', 'C'... usada en el código del espacio
    CONSTRAINT fk_piso_sede FOREIGN KEY (sede_id) REFERENCES sede(id),
    CONSTRAINT uq_piso_sede_numero UNIQUE (sede_id, numero)
);

-- ============================================================
-- 4. ESPACIO
-- Código tipo A-01, B-12 (letra del piso + número secuencial).
-- `sede_id` es redundante con piso.sede_id a propósito (v2): evita
-- 2 JOINs en la consulta más frecuente ("espacios disponibles en
-- la sede X"). El backend debe mantenerlo sincronizado con el
-- piso_id al insertar/actualizar.
-- ============================================================
CREATE TABLE espacio (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    piso_id     BIGINT NOT NULL,
    sede_id     BIGINT NOT NULL,               -- v2: acceso directo sin pasar por piso
    codigo      VARCHAR(10) NOT NULL,          -- ej. 'A-01'
    tipo        ENUM('REGULAR','DISCAPACITADO','MOTO') NOT NULL DEFAULT 'REGULAR',
    estado      ENUM('DISPONIBLE','RESERVADO','OCUPADO','MANTENIMIENTO') NOT NULL DEFAULT 'DISPONIBLE',
    CONSTRAINT fk_espacio_piso FOREIGN KEY (piso_id) REFERENCES piso(id),
    CONSTRAINT fk_espacio_sede FOREIGN KEY (sede_id) REFERENCES sede(id),
    CONSTRAINT uq_espacio_piso_codigo UNIQUE (piso_id, codigo)
);

-- ============================================================
-- 5. PLAN
-- Global (mismo precio en todas las sedes), 3 filas fijas.
-- No editable desde una pantalla de admin en esta versión.
-- ============================================================
CREATE TABLE plan (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre                  ENUM('POR_HORA','MENSUAL','ANUAL') NOT NULL UNIQUE,
    precio_base             DECIMAL(10,2) NOT NULL,
    descuento_porcentaje    DECIMAL(5,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- 6. VEHICULO
-- Máximo 5 por usuario (se valida en el backend, no en SQL).
-- ============================================================
CREATE TABLE vehiculo (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    placa           VARCHAR(10) NOT NULL UNIQUE,
    tipo            ENUM('AUTO','MOTO') NOT NULL DEFAULT 'AUTO',
    modelo          VARCHAR(80),
    usuario_id      BIGINT NOT NULL,
    CONSTRAINT fk_vehiculo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- ============================================================
-- 7. RESERVA
-- Por hora: fecha_inicio/fecha_fin puntuales.
-- Mensual/Anual: fecha_inicio + fecha_fin = fecha de vencimiento.
-- ============================================================
CREATE TABLE reserva (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    espacio_id      BIGINT NOT NULL,
    plan_id         BIGINT NOT NULL,
    vehiculo_id     BIGINT NOT NULL,
    fecha_inicio    DATETIME NOT NULL,
    fecha_fin       DATETIME NOT NULL,
    estado          ENUM('PENDIENTE','CONFIRMADA','ACTIVA','FINALIZADA','CANCELADA','EXCEDIDA') NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario(id),
    CONSTRAINT fk_reserva_espacio  FOREIGN KEY (espacio_id)  REFERENCES espacio(id),
    CONSTRAINT fk_reserva_plan     FOREIGN KEY (plan_id)     REFERENCES plan(id),
    CONSTRAINT fk_reserva_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id)
);

-- ============================================================
-- 8. TICKET
-- 1 a 1 con la reserva. Los datos de validación física
-- (ingreso/salida) viven aquí mismo — no se separan en una tabla
-- "validacion" aparte porque son datos propios de este ticket.
-- ============================================================
CREATE TABLE ticket (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id              BIGINT NOT NULL UNIQUE,
    codigo                  VARCHAR(30) NOT NULL UNIQUE,     -- ej. PS-2026-07-28-00123
    qr_code                 VARCHAR(255) NOT NULL,           -- cambia en cada reserva
    monto_pagado            DECIMAL(10,2) NOT NULL,
    fecha_ingreso_real      DATETIME NULL,
    fecha_salida_real       DATETIME NULL,
    operador_ingreso_id     BIGINT NULL,
    operador_salida_id      BIGINT NULL,
    cobro_adicional         DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_ticket_reserva            FOREIGN KEY (reserva_id)          REFERENCES reserva(id),
    CONSTRAINT fk_ticket_operador_ingreso   FOREIGN KEY (operador_ingreso_id) REFERENCES usuario(id),
    CONSTRAINT fk_ticket_operador_salida    FOREIGN KEY (operador_salida_id)  REFERENCES usuario(id)
);

-- ============================================================
-- 9. PAGO
-- ============================================================
CREATE TABLE pago (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id      BIGINT NOT NULL,
    metodo          ENUM('EFECTIVO','TARJETA','YAPE','PLIN') NOT NULL,  -- v2: se agregó PLIN
    monto           DECIMAL(10,2) NOT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_reserva FOREIGN KEY (reserva_id) REFERENCES reserva(id)
);

-- ============================================================
-- 10. DEUDA
-- Sistema "estilo Uber": si queda deuda pendiente, el usuario no
-- puede crear una nueva reserva (esa regla se valida en el
-- backend antes de aceptar la reserva).
-- ============================================================
CREATE TABLE deuda (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    reserva_id      BIGINT NULL,
    monto           DECIMAL(10,2) NOT NULL,
    descripcion     VARCHAR(255),
    estado          ENUM('PENDIENTE','PAGADA') NOT NULL DEFAULT 'PENDIENTE',
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deuda_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    CONSTRAINT fk_deuda_reserva FOREIGN KEY (reserva_id) REFERENCES reserva(id)
);

-- ============================================================
-- 11. INCIDENTE
-- Flujo: Operador reporta (ABIERTO) → Admin revisa y da la
-- solución (EN_PROCESO → RESUELTO) → Operador ejecuta y cierra
-- (CERRADO).
-- ============================================================
CREATE TABLE incidente (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    espacio_id          BIGINT NULL,
    ticket_id           BIGINT NULL,
    operador_id         BIGINT NOT NULL,                 -- quién lo reportó
    admin_id            BIGINT NULL,                      -- quién dio la solución
    tipo                ENUM('ABANDONADO','EXCESO_TIEMPO','ESTACIONAMIENTO_INDEBIDO','DANIO_PROPIEDAD','SEGURIDAD','USO_INDEBIDO_CONADIS') NOT NULL,
    descripcion         VARCHAR(500) NOT NULL,
    solucion            VARCHAR(500) NULL,
    estado              ENUM('ABIERTO','EN_PROCESO','RESUELTO','CERRADO') NOT NULL DEFAULT 'ABIERTO',
    fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre        DATETIME NULL,
    CONSTRAINT fk_incidente_espacio  FOREIGN KEY (espacio_id)  REFERENCES espacio(id),
    CONSTRAINT fk_incidente_ticket   FOREIGN KEY (ticket_id)   REFERENCES ticket(id),
    CONSTRAINT fk_incidente_operador FOREIGN KEY (operador_id) REFERENCES usuario(id),
    CONSTRAINT fk_incidente_admin    FOREIGN KEY (admin_id)    REFERENCES usuario(id)
);

-- ============================================================
-- ÍNDICES
-- Solo los que de verdad importan para las consultas frecuentes,
-- pensado para el volumen estimado (100-500 reservas/día, ~250 espacios).
-- ============================================================
CREATE INDEX idx_reserva_usuario   ON reserva(usuario_id);
CREATE INDEX idx_reserva_espacio   ON reserva(espacio_id);
CREATE INDEX idx_reserva_fechas    ON reserva(fecha_inicio, fecha_fin);
CREATE INDEX idx_espacio_piso      ON espacio(piso_id);
CREATE INDEX idx_espacio_sede      ON espacio(sede_id);   -- v2: soporta "espacios disponibles por sede"
CREATE INDEX idx_espacio_estado    ON espacio(estado);
CREATE INDEX idx_deuda_usuario     ON deuda(usuario_id, estado);
CREATE INDEX idx_ticket_codigo     ON ticket(codigo);

-- ============================================================
-- DATOS INICIALES (seeds)
-- ============================================================

-- Planes fijos (según lo definido: 20% mensual, 25% anual)
INSERT INTO plan (nombre, precio_base, descuento_porcentaje) VALUES
('POR_HORA', 5.00, 0),
('MENSUAL', 150.00, 20),
('ANUAL', 1800.00, 25);

-- Sedes de ejemplo
INSERT INTO sede (nombre, direccion, distrito, hora_apertura, hora_cierre) VALUES
('ParkSpot Miraflores', 'Av. Larco 123', 'Miraflores', '06:00:00', '23:00:00'),
('ParkSpot San Isidro', 'Av. Rivera Navarrete 501', 'San Isidro', '06:00:00', '23:00:00'),
('ParkSpot Lima Centro', 'Jr. de la Unión 620', 'Lima', '07:00:00', '22:00:00');

-- Pisos de ejemplo (2 pisos por sede)
INSERT INTO piso (sede_id, numero, letra) VALUES
(1, 1, 'A'), (1, 2, 'B'),
(2, 1, 'A'), (2, 2, 'B'),
(3, 1, 'A');

-- Espacios de ejemplo (5 espacios en el piso 1 de la sede 1)
-- sede_id se repite a propósito junto con piso_id (ver nota v2 en la tabla espacio)
INSERT INTO espacio (piso_id, sede_id, codigo, tipo, estado) VALUES
(1, 1, 'A-01', 'REGULAR', 'DISPONIBLE'),
(1, 1, 'A-02', 'REGULAR', 'DISPONIBLE'),
(1, 1, 'A-03', 'DISCAPACITADO', 'DISPONIBLE'),
(1, 1, 'A-04', 'REGULAR', 'OCUPADO'),
(1, 1, 'A-05', 'MOTO', 'DISPONIBLE');

-- Un administrador inicial (password ya cifrada con BCrypt en el backend, aquí solo referencial)
INSERT INTO usuario (nombres, apellidos, email, password, celular, rol) VALUES
('Admin', 'ParkSpot', 'admin@parkspot.pe', '$2a$10$examplehash', '999999999', 'ADMIN');