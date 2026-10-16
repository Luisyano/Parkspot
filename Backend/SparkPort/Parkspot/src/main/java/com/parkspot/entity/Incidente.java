package com.parkspot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "incidente")
public class Incidente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id")
    private Espacio espacio;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id")
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operador_id", nullable = false)
    private Usuario operador; // quién lo reportó

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Usuario admin; // quién dio la solución

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoIncidente tipo;

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "solucion", length = 500)
    private String solucion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoIncidente estado = EstadoIncidente.ABIERTO;

    @Column(name = "fecha_creacion", nullable = false, updatable = false, insertable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    public enum TipoIncidente {
        ABANDONADO, EXCESO_TIEMPO, ESTACIONAMIENTO_INDEBIDO, DANIO_PROPIEDAD, SEGURIDAD, USO_INDEBIDO_CONADIS
    }

    public enum EstadoIncidente {
        ABIERTO, EN_PROCESO, RESUELTO, CERRADO
    }
}