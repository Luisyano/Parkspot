package com.parkspot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Ticket.
 * Se genera 1 a 1 con cada reserva confirmada.
 * Contiene toda la información de validación física (ingreso/salida).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketDTO {

    private Long id;

    private Long reservaId;

    private String codigo; // ej. PS-2026-07-28-00123

    private String qrCode; // código QR en formato Base64 o URL

    private BigDecimal montoPagado;

    // === Validación física (ingreso/salida) ===

    private LocalDateTime fechaIngresoReal; // null si aún no ha ingresado

    private LocalDateTime fechaSalidaReal; // null si aún no ha salido

    private Long operadorIngresoId; // ID del operador que validó el ingreso

    private Long operadorSalidaId; // ID del operador que validó la salida

    private BigDecimal cobroAdicional; // por exceso de tiempo

    // Datos anidados para mostrar en el frontend
    private String nombreUsuario;
    private String codigoEspacio;
    private String placaVehiculo;
}