package com.parkspot.repository;

import com.parkspot.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la entidad Vehiculo.
 */
@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    /**
     * Busca un vehículo por su placa (única).
     * Usado para validar que no se dupliquen placas.
     */
    Optional<Vehiculo> findByPlaca(String placa);

    /**
     * Verifica si ya existe un vehículo con esa placa.
     */
    boolean existsByPlaca(String placa);

    /**
     * Busca todos los vehículos de un usuario.
     * Para mostrar en el perfil del cliente.
     */
    List<Vehiculo> findByUsuarioId(Long usuarioId);

    /**
     * Cuenta cuántos vehículos tiene un usuario.
     * Para validar el límite máximo (5 vehículos).
     */
    long countByUsuarioId(Long usuarioId);
}