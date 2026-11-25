import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { crearRepositorioArchivo, crearServicioUsuarios } from "../src/index.mjs";

function carpetaTemporal() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gestor-usuarios-"));
}

test("el archivo conserva el orden y los cambios entre instancias", () => {
  const dir = carpetaTemporal();
  const ruta = path.join(dir, "usuarios.json");

  try {
    const repo = crearRepositorioArchivo(ruta);
    repo.guardar({ id: "1", nombre: "Ana", email: "ana@ejemplo.com" });
    repo.guardar({ id: "2", nombre: "Luis", email: "luis@ejemplo.com" });
    repo.guardar({ id: "1", nombre: "Ana María", email: "ana@ejemplo.com" });

    assert.deepEqual(
      repo.listar().map((usuario) => usuario.nombre),
      ["Ana María", "Luis"],
    );

    const servicio = crearServicioUsuarios({ repositorio: crearRepositorioArchivo(ruta) });
    const creado = servicio.crear({ nombre: "Marta Díaz", email: "Marta@Ejemplo.com" });
    const otraInstancia = crearServicioUsuarios({ repositorio: crearRepositorioArchivo(ruta) });

    assert.equal(otraInstancia.obtener(creado.id).email, "marta@ejemplo.com");
    assert.equal(repo.eliminar("1"), true);
    assert.equal(repo.buscarPorId("1"), null);
    assert.equal(repo.eliminar("1"), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("un archivo vacío o inexistente se trata como una lista vacía", () => {
  const dir = carpetaTemporal();

  try {
    const inexistente = crearRepositorioArchivo(path.join(dir, "nuevo", "usuarios.json"));
    assert.deepEqual(inexistente.listar(), []);

    const ruta = path.join(dir, "vacio.json");
    fs.writeFileSync(ruta, "   ");
    assert.deepEqual(crearRepositorioArchivo(ruta).listar(), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("un archivo dañado explica que no se pudo leer", () => {
  const dir = carpetaTemporal();
  const ruta = path.join(dir, "usuarios.json");

  try {
    fs.writeFileSync(ruta, "{");
    assert.throws(() => crearRepositorioArchivo(ruta).listar(), /No se pudo leer el archivo de usuarios/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
