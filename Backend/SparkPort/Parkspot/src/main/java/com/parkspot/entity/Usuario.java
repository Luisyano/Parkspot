package com.parkspot.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    @Column(name = "email", nullable = false, length = 150, unique = true)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "celular", length = 20)
    private String celular;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private Rol rol = Rol.CLIENTE;

    // Solo aplica si rol = OPERADOR (un operador está asignado a una sola sede)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sede_id")
    private Sede sede;

    // CONADIS
    @Column(name = "conadis_verificado", nullable = false)
    private Boolean conadisVerificado = false;

    @Column(name = "conadis_imagen_url", length = 255)
    private String conadisImagenUrl;

    @Column(name = "conadis_fecha_expiracion")
    private LocalDate conadisFechaExpiracion;

    // Para renovación automática de membresías
    @Column(name = "tiene_tarjeta_guardada", nullable = false)
    private Boolean tieneTarjetaGuardada = false;

    @Column(name = "fecha_creacion", nullable = false, updatable = false, insertable = false)
    private LocalDateTime fechaCreacion;

    // ========== RELACIONES ==========
    
    @JsonIgnore
    @OneToMany(mappedBy = "usuario")
    private List<Vehiculo> vehiculos;

    @JsonIgnore
    @OneToMany(mappedBy = "usuario")
    private List<Reserva> reservas;

    @JsonIgnore
    @OneToMany(mappedBy = "usuario")
    private List<Deuda> deudas;

    // Tickets que este operador validó (ingreso)
    @JsonIgnore
    @OneToMany(mappedBy = "operadorIngreso")
    private List<Ticket> ticketsValidadosIngreso;

    // Tickets que este operador validó (salida)
    @JsonIgnore
    @OneToMany(mappedBy = "operadorSalida")
    private List<Ticket> ticketsValidadosSalida;

    // Incidentes reportados por este operador
    @JsonIgnore
    @OneToMany(mappedBy = "operador")
    private List<Incidente> incidentesReportados;

    // Incidentes resueltos por este admin
    @JsonIgnore
    @OneToMany(mappedBy = "admin")
    private List<Incidente> incidentesResueltos;

    // ========== ENUMS ==========
    
    public enum Rol {
        CLIENTE, OPERADOR, ADMIN
    }
}