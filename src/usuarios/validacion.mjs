import { ValidacionError } from "./errores.mjs";

export const ROLES = Object.freeze(["admin", "editor", "lector"]);

const CAMPOS_ACTUALIZABLES = new Set(["nombre", "email", "rol", "activo"]);
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function exigirObjeto(valor, mensaje, campo) {
  if (valor === null || typeof valor !== "object" || Array.isArray(valor)) {
    throw new ValidacionError(mensaje, { [campo]: "tiene que ser un objeto" });
  }
}

function leerNombre(valor, campos) {
  if (typeof valor !== "string") {
    campos.nombre = "tiene que ser texto";
    return;
  }

  const nombre = valor.trim().replace(/\s+/g, " ");
  if (nombre.length < 2 || nombre.length > 80) {
    campos.nombre = "escribe entre 2 y 80 caracteres";
    return;
  }

  return nombre;
}

function leerEmail(valor, campos) {
  if (typeof valor !== "string") {
    campos.email = "tiene que ser texto";
    return;
  }

  const email = valor.trim().toLowerCase();
  if (!CORREO.test(email)) {
    campos.email = "escribe un correo válido";
    return;
  }

  return email;
}

function leerRol(valor, campos) {
  if (typeof valor !== "string" || !ROLES.includes(valor)) {
    campos.rol = "usa admin, editor o lector";
    return;
  }

  return valor;
}

function leerActivo(valor, campos) {
  if (typeof valor !== "boolean") {
    campos.activo = "tiene que ser verdadero o falso";
    return;
  }

  return valor;
}

function lanzarSiHayCampos(campos, mensaje) {
  if (Object.keys(campos).length > 0) {
    throw new ValidacionError(mensaje, campos);
  }
}

export function validarNuevoUsuario(datos) {
  exigirObjeto(datos, "Los datos del usuario tienen que ser un objeto.", "datos");

  const campos = {};
  const nombre = leerNombre(datos.nombre, campos);
  const email = leerEmail(datos.email, campos);
  const rol = datos.rol === undefined ? "lector" : leerRol(datos.rol, campos);

  lanzarSiHayCampos(campos, "Los datos del usuario no son válidos.");
  return { nombre, email, rol };
}

export function validarActualizacion(cambios) {
  exigirObjeto(cambios, "Los cambios tienen que ser un objeto.", "cambios");

  const campos = {};
  const desconocidos = Object.keys(cambios).filter((clave) => !CAMPOS_ACTUALIZABLES.has(clave));
  if (desconocidos.length > 0) {
    campos.desconocidos = `no se pueden modificar: ${desconocidos.join(", ")}`;
  }

  const resultado = {};
  if ("nombre" in cambios) {
    const nombre = leerNombre(cambios.nombre, campos);
    if (nombre !== undefined) resultado.nombre = nombre;
  }
  if ("email" in cambios) {
    const email = leerEmail(cambios.email, campos);
    if (email !== undefined) resultado.email = email;
  }
  if ("rol" in cambios) {
    const rol = leerRol(cambios.rol, campos);
    if (rol !== undefined) resultado.rol = rol;
  }
  if ("activo" in cambios) {
    const activo = leerActivo(cambios.activo, campos);
    if (activo !== undefined) resultado.activo = activo;
  }

  lanzarSiHayCampos(campos, "Los cambios del usuario no son válidos.");

  if (Object.keys(resultado).length === 0) {
    throw new ValidacionError("Indica al menos un campo para actualizar.", {
      cambios: "está vacío",
    });
  }

  return resultado;
}

export function validarFiltro(filtro) {
  const criterio = filtro ?? {};
  exigirObjeto(criterio, "El filtro tiene que ser un objeto.", "filtro");

  const campos = {};
  if (criterio.rol !== undefined) leerRol(criterio.rol, campos);
  if (criterio.activo !== undefined) leerActivo(criterio.activo, campos);
  if (criterio.texto !== undefined && typeof criterio.texto !== "string") {
    campos.texto = "tiene que ser texto";
  }

  lanzarSiHayCampos(campos, "El filtro no es válido.");
  return criterio;
}
