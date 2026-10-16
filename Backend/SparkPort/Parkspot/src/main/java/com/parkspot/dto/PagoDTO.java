package com.parkspot.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Pago.
 * Registra los pagos realizados por los usuarios.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagoDTO {

    private Long id;

    private Long reservaId;

    private String metodo; // "EFECTIVO", "TARJETA", "YAPE", "PLIN"

    private BigDecimal monto;

    private LocalDateTime fecha;
}