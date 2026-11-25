import crypto from "node:crypto";
import { ConflictoError, NoEncontradoError, ValidacionError } from "./errores.mjs";
import { crearRepositorioMemoria } from "./repositorio.mjs";
import { validarActualizacion, validarFiltro, validarNuevoUsuario } from "./validacion.mjs";

function coincide(usuario, filtro) {
  if (filtro.rol !== undefined && usuario.rol !== filtro.rol) return false;
  if (filtro.activo !== undefined && usuario.activo !== filtro.activo) return false;

  if (typeof filtro.texto === "string" && filtro.texto.trim() !== "") {
    const texto = filtro.texto.trim().toLowerCase();
    const objetivo = `${usuario.nombre} ${usuario.email}`.toLowerCase();
    if (!objetivo.includes(texto)) return false;
  }

  return true;
}

/**
 * Crea el gestor de usuarios.
 * El repositorio se puede sustituir; por defecto los datos viven solo en memoria.
 */
export function crearServicioUsuarios(opciones = {}) {
  const repositorio = opciones.repositorio ?? crearRepositorioMemoria();
  const crearId = opciones.crearId ?? (() => crypto.randomUUID());
  const ahora = opciones.ahora ?? (() => new Date().toISOString());

  function exigir(id) {
    if (typeof id !== "string" || id.trim() === "") {
      throw new ValidacionError("El id del usuario es obligatorio.", { id: "es obligatorio" });
    }

    const usuario = repositorio.buscarPorId(id);
    if (!usuario) {
      throw new NoEncontradoError(`No existe un usuario con id ${id}.`);
    }

    return usuario;
  }

  function asegurarEmailLibre(email, idActual) {
    const existente = repositorio.buscarPorEmail(email);
    if (existente && existente.id !== idActual) {
      throw new ConflictoError(`Ya hay un usuario con el correo ${email}.`);
    }
  }

  function fijarActivo(id, activo) {
    const actual = exigir(id);
    if (actual.activo === activo) return { ...actual };

    const usuario = { ...actual, activo, actualizadoEn: ahora() };
    repositorio.guardar(usuario);
    return { ...usuario };
  }

  return {
    crear(datos) {
      const { nombre, email, rol } = validarNuevoUsuario(datos);
      asegurarEmailLibre(email);

      const marca = ahora();
      const usuario = {
        id: crearId(),
        nombre,
        email,
        rol,
        activo: true,
        creadoEn: marca,
        actualizadoEn: marca,
      };

      repositorio.guardar(usuario);
      return { ...usuario };
    },

    listar(filtro) {
      const criterio = validarFiltro(filtro);
      return repositorio.listar().filter((usuario) => coincide(usuario, criterio));
    },

    obtener(id) {
      return { ...exigir(id) };
    },

    actualizar(id, cambios) {
      const actual = exigir(id);
      const parcial = validarActualizacion(cambios);
      if (parcial.email) asegurarEmailLibre(parcial.email, actual.id);

      const usuario = {
        ...actual,
        ...parcial,
        id: actual.id,
        creadoEn: actual.creadoEn,
        actualizadoEn: ahora(),
      };

      repositorio.guardar(usuario);
      return { ...usuario };
    },

    activar(id) {
      return fijarActivo(id, true);
    },

    desactivar(id) {
      return fijarActivo(id, false);
    },

    eliminar(id) {
      exigir(id);
      if (!repositorio.eliminar(id)) {
        throw new NoEncontradoError(`No existe un usuario con id ${id}.`);
      }
    },
  };
}
