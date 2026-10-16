package com.parkspot.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Reserva.
 * Es el objeto más importante del sistema.
 * Una reserva puede ser:
 * - POR_HORA: con fecha_inicio y fecha_fin puntuales
 * - MENSUAL/ANUAL: fecha_inicio = inicio del periodo, fecha_fin = fin del periodo
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaDTO {

    private Long id;

    private Long usuarioId;

    private Long espacioId;

    private Long planId;

    private Long vehiculoId;

    private LocalDateTime fechaInicio;

    private LocalDateTime fechaFin;

    private String estado; // "PENDIENTE", "CONFIRMADA", "ACTIVA", "FINALIZADA", "CANCELADA", "EXCEDIDA"

    private LocalDateTime fechaCreacion;

    // Datos anidados (para mostrar en el frontend sin hacer otra consulta)
    private String nombreUsuario;
    private String codigoEspacio;
    private String nombrePlan;
    private String placaVehiculo;

    // IDs de relaciones (para el frontend)
    private Long ticketId; // si ya se generó el ticket
    private Long pagoId; // si ya se realizó el pago
    private Long deudaId; // si hay deuda asociada
}