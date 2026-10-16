package com.parkspot.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Piso.
 * Representa un piso dentro de una sede.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PisoDTO {

    private Long id;

    private Long sedeId; // ID de la sede a la que pertenece

    private Integer numero;

    private String letra; // 'A', 'B', 'C'...

    // Opcional: lista de espacios (si se necesita)
    private List<EspacioDTO> espacios;
}