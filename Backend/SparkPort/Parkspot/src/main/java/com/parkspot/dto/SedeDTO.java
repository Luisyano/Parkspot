package com.parkspot.dto;

import java.time.LocalTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Sede.
 * Se usa para transferir datos entre el backend y el frontend,
 * sin exponer las relaciones completas de la entidad.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SedeDTO {

    private Long id;

    private String nombre;

    private String direccion;

    private String distrito;

    private LocalTime horaApertura;

    private LocalTime horaCierre;

    private String estado; // "ACTIVA", "PAUSADA", "INACTIVA"

    // Opcional: lista de pisos (solo si se necesita en la respuesta)
    private List<PisoDTO> pisos;
}