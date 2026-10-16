package com.parkspot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Deuda.
 * Sistema "estilo Uber": si un usuario tiene deuda pendiente,
 * no puede crear nuevas reservas.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeudaDTO {

    private Long id;

    private Long usuarioId;

    private Long reservaId; // opcional, la reserva que generó la deuda

    private BigDecimal monto;

    private String descripcion;

    private String estado; // "PENDIENTE", "PAGADA"

    private LocalDateTime fecha;
}