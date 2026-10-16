package com.parkspot.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Plan.
 * Solo lectura: los 3 planes (POR_HORA, MENSUAL, ANUAL)
 * ya vienen sembrados en la base de datos.
 * No se expone un endpoint para crear nuevos planes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlanDTO {

    private Long id;

    private String nombre; // "POR_HORA", "MENSUAL", "ANUAL"

    private BigDecimal precioBase;

    private BigDecimal descuentoPorcentaje;

    // Calculado en el backend o frontend: precioBase * (1 - descuentoPorcentaje/100)
    private BigDecimal precioFinal;
}