package com.parkspot.entity;

import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sede")
public class Sede {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "direccion", nullable = false, length = 200)
    private String direccion;

    @Column(name = "distrito", nullable = false, length = 80)
    private String distrito;

    @Column(name = "hora_apertura", nullable = false)
    private LocalTime horaApertura;

    @Column(name = "hora_cierre", nullable = false)
    private LocalTime horaCierre;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoSede estado = EstadoSede.ACTIVA;

    // Relaciones
    @JsonIgnore
    @OneToMany(mappedBy = "sede")
    private List<Piso> pisos;

    @JsonIgnore
    @OneToMany(mappedBy = "sede")
    private List<Espacio> espacios;  // Optimización: acceso directo

    @JsonIgnore
    @OneToMany(mappedBy = "sede")
    private List<Usuario> operadores;  // Solo usuarios con rol = OPERADOR

    public enum EstadoSede {
        ACTIVA, PAUSADA, INACTIVA
    }
}