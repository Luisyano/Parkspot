package com.parkspot.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Incidente.
 * Flujo:
 * 1. Operador reporta → estado = ABIERTO
 * 2. Admin revisa y da solución → estado = RESUELTO
 * 3. Operador ejecuta y cierra → estado = CERRADO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidenteDTO {

    private Long id;

    private Long espacioId; // opcional

    private Long ticketId; // opcional

    private Long operadorId; // quién lo reportó (obligatorio)

    private Long adminId; // quién dio la solución (opcional)

    private String tipo; // "ABANDONADO", "EXCESO_TIEMPO", "ESTACIONAMIENTO_INDEBIDO", "DANIO_PROPIEDAD", "SEGURIDAD", "USO_INDEBIDO_CONADIS"

    private String descripcion;

    private String solucion; // la solución que da el Administrador

    private String estado; // "ABIERTO", "EN_PROCESO", "RESUELTO", "CERRADO"

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaCierre; // cuando se cierra el incidente

    // Datos anidados para mostrar en el frontend
    private String nombreOperador;
    private String nombreAdmin;
    private String codigoEspacio;
}