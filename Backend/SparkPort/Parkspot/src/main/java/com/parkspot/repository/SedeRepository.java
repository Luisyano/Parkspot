package com.parkspot.repository;

import com.parkspot.entity.Sede;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para la entidad Sede.
 * Proporciona métodos CRUD y consultas personalizadas.
 */
@Repository
public interface SedeRepository extends JpaRepository<Sede, Long> {

    /**
     * Busca sedes por distrito.
     * Usado en la búsqueda del cliente: "Mostrar sedes en Miraflores"
     */
    List<Sede> findByDistrito(String distrito);

    /**
     * Busca sedes por estado.
     * Usado para filtrar sedes activas/inactivas.
     */
    List<Sede> findByEstado(Sede.EstadoSede estado);

    /**
     * Busca sedes activas en un distrito específico.
     * Consulta más común en la búsqueda del cliente.
     */
    List<Sede> findByDistritoAndEstado(String distrito, Sede.EstadoSede estado);
}