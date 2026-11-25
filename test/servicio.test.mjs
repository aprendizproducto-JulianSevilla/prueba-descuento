import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictoError,
  NoEncontradoError,
  ValidacionError,
  crearServicioUsuarios,
} from "../src/index.mjs";

function crearGestor() {
  let marca = 0;
  let secuencia = 0;
  return crearServicioUsuarios({
    crearId: () => {
      secuencia += 1;
      return `usr-${secuencia}`;
    },
    ahora: () => {
      marca += 1;
      return `2026-01-01T00:00:0${marca}.000Z`;
    },
  });
}

test("crea un usuario, normaliza el correo y usa el rol lector", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "  Ana   López ", email: "Ana@Ejemplo.com" });

  assert.deepEqual(ana, {
    id: "usr-1",
    nombre: "Ana López",
    email: "ana@ejemplo.com",
    rol: "lector",
    activo: true,
    creadoEn: "2026-01-01T00:00:01.000Z",
    actualizadoEn: "2026-01-01T00:00:01.000Z",
  });
});

test("el objeto devuelto no modifica el usuario guardado", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com" });
  ana.nombre = "Otra persona";

  assert.equal(usuarios.obtener(ana.id).nombre, "Ana López");
});

test("rechaza datos incompletos, roles desconocidos y correos repetidos", () => {
  const usuarios = crearGestor();
  usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com", rol: "admin" });

  assert.throws(
    () => usuarios.crear({ nombre: "A", email: "no-es-correo", rol: "dueño" }),
    (error) => {
      assert.ok(error instanceof ValidacionError);
      assert.equal(error.campos.nombre, "escribe entre 2 y 80 caracteres");
      assert.equal(error.campos.email, "escribe un correo válido");
      assert.equal(error.campos.rol, "usa admin, editor o lector");
      return true;
    },
  );

  assert.throws(
    () => usuarios.crear({ nombre: "Ana Dos", email: "ANA@ejemplo.com" }),
    ConflictoError,
  );
});

test("lista por rol, estado y texto", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com", rol: "admin" });
  usuarios.crear({ nombre: "Luis Pérez", email: "luis@ejemplo.com", rol: "editor" });
  usuarios.desactivar(ana.id);

  assert.deepEqual(
    usuarios.listar({ rol: "admin", activo: false, texto: "ANA" }).map((usuario) => usuario.email),
    ["ana@ejemplo.com"],
  );
  assert.throws(() => usuarios.listar({ rol: "dueño" }), ValidacionError);
});

test("actualiza campos permitidos y conserva id y fecha de creación", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com" });

  const actualizada = usuarios.actualizar(ana.id, {
    nombre: "Ana María López",
    email: "ana.maria@ejemplo.com",
    rol: "editor",
  });

  assert.equal(actualizada.id, ana.id);
  assert.equal(actualizada.creadoEn, ana.creadoEn);
  assert.equal(actualizada.nombre, "Ana María López");
  assert.equal(actualizada.rol, "editor");
  assert.notEqual(actualizada.actualizadoEn, ana.actualizadoEn);
  assert.throws(() => usuarios.actualizar(ana.id, { id: "otro" }), ValidacionError);
  assert.throws(() => usuarios.actualizar(ana.id, {}), ValidacionError);
});

test("activar y desactivar son idempotentes", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com" });

  const primera = usuarios.desactivar(ana.id);
  const segunda = usuarios.desactivar(ana.id);
  assert.equal(primera.activo, false);
  assert.equal(segunda.actualizadoEn, primera.actualizadoEn);

  assert.equal(usuarios.activar(ana.id).activo, true);
});

test("obtener y eliminar avisan cuando el usuario no existe", () => {
  const usuarios = crearGestor();
  const ana = usuarios.crear({ nombre: "Ana López", email: "ana@ejemplo.com" });

  assert.throws(() => usuarios.obtener("no-existe"), NoEncontradoError);
  usuarios.eliminar(ana.id);
  assert.throws(() => usuarios.eliminar(ana.id), NoEncontradoError);
  assert.deepEqual(usuarios.listar(), []);
});
