package com.parkspot.repository;

import com.parkspot.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la entidad Usuario.
 * Incluye métodos para autenticación y gestión de usuarios.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Busca un usuario por su email (único).
     * Usado en el login y en validaciones de registro.
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Verifica si ya existe un usuario con ese email.
     * Usado en el registro para evitar duplicados.
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuarios por rol.
     * Ej: listar todos los operadores o todos los clientes.
     */
    List<Usuario> findByRol(Usuario.Rol rol);

    /**
     * Busca operadores asignados a una sede específica.
     */
    List<Usuario> findByRolAndSedeId(Usuario.Rol rol, Long sedeId);

    /**
     * Busca usuarios con CONADIS verificado.
     * Para reportes o filtros especiales.
     */
    List<Usuario> findByConadisVerificadoTrue();
}