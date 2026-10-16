package com.parkspot.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la entidad Usuario.
 * Incluye los campos necesarios para el registro, login y perfil.
 * 
 * ⚠️ El password SOLO se usa en el registro y login.
 *    No se incluye en las respuestas de consulta (se setea a null).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {

    private Long id;

    private String nombres;

    private String apellidos;

    private String email;

    // ⚠️ Password: SOLO para registro/login. En respuestas siempre es null.
    private String password;

    private String celular;

    private String rol; // "CLIENTE", "OPERADOR", "ADMIN"

    private Long sedeId; // Solo si el rol es OPERADOR

    private Boolean conadisVerificado;

    private String conadisImagenUrl;

    private LocalDate conadisFechaExpiracion;

    private Boolean tieneTarjetaGuardada;

    private LocalDateTime fechaCreacion;

    // Opcional: listas de relaciones (si se necesitan)
    private List<VehiculoDTO> vehiculos;
}