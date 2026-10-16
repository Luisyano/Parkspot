package com.parkspot.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "piso")
public class Piso {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sede_id", nullable = false)
	private Sede sede;

	@Column(name = "numero", nullable = false)
	private Integer numero;

	@Column(name = "letra", nullable = false, length = 1)
	private String letra; // 'A', 'B', 'C'... usada en el código del espacio

	@JsonIgnore
	@OneToMany(mappedBy = "piso")
	private List<Espacio> espacios;
}