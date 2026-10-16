package com.parkspot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Vehiculo.
 * Representa un vehículo registrado por un usuario.
 * Máximo 5 vehículos por usuario (validado en el backend).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehiculoDTO {

    private Long id;

    private String placa;

    private String tipo; // "AUTO", "MOTO"

    private String modelo;

    private Long usuarioId; // ID del dueño del vehículo
}