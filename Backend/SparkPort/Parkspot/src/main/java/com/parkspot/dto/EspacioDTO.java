package com.parkspot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Espacio.
 * Representa un espacio de estacionamiento individual.
 * El código sigue el formato: [LetraPiso]-[Número] ej. 'A-01'
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EspacioDTO {

    private Long id;

    private Long pisoId; // ID del piso donde está el espacio

    private Long sedeId; // ID de la sede (acceso directo, optimización)

    private String codigo; // ej. 'A-01'

    private String tipo; // "REGULAR", "DISCAPACITADO", "MOTO"

    private String estado; // "DISPONIBLE", "RESERVADO", "OCUPADO", "MANTENIMIENTO"
}