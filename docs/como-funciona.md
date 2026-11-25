# Cómo funciona el gestor de usuarios

Este proyecto da de alta, consulta, modifica y elimina usuarios. Cada usuario tiene nombre, correo, rol y un estado activo o inactivo.

Hay dos formas de usarlo:

- Como librería, importando `crearServicioUsuarios` desde `src/index.mjs`.
- Por terminal, con `node src/cli.mjs`.

La terminal guarda los datos en un archivo JSON. La librería, si no le pasas un repositorio, los guarda solo en memoria y se pierden al terminar el proceso.

## Estructura

```text
src/index.mjs                  Puerta de entrada de la librería
src/cli.mjs                    Comandos de terminal
src/usuarios/validacion.mjs    Forma y reglas de los datos
src/usuarios/servicio.mjs      Casos de uso: crear, listar, cambiar, borrar
src/usuarios/repositorio.mjs   Dónde se guardan los usuarios
src/usuarios/errores.mjs       Errores de validación, conflicto y no encontrado
docs/como-funciona.md          Este documento
test/                          Pruebas de servicio, archivo y terminal
```

Las capas se hablan en una sola dirección:

```text
terminal o código cliente
        |
        v
     servicio
        |
        v
   validación y errores
        |
        v
    repositorio
     |      |
     v      v
  memoria  archivo JSON
```

El servicio no sabe si los datos están en memoria o en disco. El repositorio no decide si un correo es válido ni si está repetido. Por eso se puede cambiar el almacenamiento sin reescribir las reglas.

## Un usuario

```json
{
  "id": "7c1c1a2e-3b4a-4d5e-9f60-1a2b3c4d5e6f",
  "nombre": "Ana López",
  "email": "ana@ejemplo.com",
  "rol": "lector",
  "activo": true,
  "creadoEn": "2026-11-25T15:00:00.000Z",
  "actualizadoEn": "2026-11-25T15:00:00.000Z"
}
```

| Campo | Regla |
| --- | --- |
| `id` | Lo genera el servicio. No se puede cambiar. |
| `nombre` | Texto de 2 a 80 caracteres. Se recortan los espacios sobrantes. |
| `email` | Correo con forma `nombre@dominio.ext`. Se guarda en minúsculas. No puede repetirse. |
| `rol` | `admin`, `editor` o `lector`. Si no se indica al crear, queda `lector`. |
| `activo` | Empieza en `true`. `desactivar` lo pasa a `false` y el usuario sigue existiendo. |
| `creadoEn` | Fecha de alta. No cambia. |
| `actualizadoEn` | Cambia en cada actualización aceptada. Activar o desactivar no la mueve si el estado ya era ese. |

`eliminar` borra el registro. `desactivar` solo lo marca inactivo, así que se puede volver a activar.

## Qué hace cada operación

`crear(datos)` valida nombre, correo y rol, comprueba que el correo esté libre y guarda el usuario. Devuelve una copia.

`listar(filtro)` devuelve los usuarios en el orden en que se crearon. El filtro es opcional:

- `rol`: solo ese rol.
- `activo`: `true` o `false`.
- `texto`: busca en el nombre y en el correo, sin distinguir mayúsculas.

`obtener(id)` devuelve una copia o lanza un error si no existe.

`actualizar(id, cambios)` acepta `nombre`, `email`, `rol` y `activo`. Ignorar el resto no está permitido: un campo como `id` produce un error. Cambiar el correo al mismo que ya tiene otro usuario también produce un error. El propio correo del usuario sí se puede volver a enviar.

`activar(id)` y `desactivar(id)` cambian el estado. Si el usuario ya estaba en ese estado, la fecha de actualización no se mueve.

`eliminar(id)` borra el usuario. Pedirlo otra vez produce un error de no encontrado.

Las funciones devuelven copias. Cambiar el objeto recibido no cambia el usuario guardado.

## Errores

Todos heredan de `ErrorGestorUsuarios` y traen un `codigo`.

| Error | Código | Cuándo aparece |
| --- | --- | --- |
| `ValidacionError` | `validacion` | Falta un dato, el formato no sirve o se intenta cambiar un campo prohibido. `error.campos` dice qué falló. |
| `ConflictoError` | `conflicto` | El correo ya pertenece a otro usuario. |
| `NoEncontradoError` | `no_encontrado` | El id no existe. |

## Uso como librería

```js
import { crearServicioUsuarios } from "./src/index.mjs";

const usuarios = crearServicioUsuarios();

const ana = usuarios.crear({
  nombre: "Ana López",
  email: "ana@ejemplo.com",
  rol: "admin",
});

usuarios.listar({ rol: "admin", texto: "ana" });
usuarios.actualizar(ana.id, { rol: "editor" });
usuarios.desactivar(ana.id);
usuarios.eliminar(ana.id);
```

Para que los datos sobrevivan al proceso, pasa el repositorio de archivo:

```js
import { crearRepositorioArchivo, crearServicioUsuarios } from "./src/index.mjs";

const usuarios = crearServicioUsuarios({
  repositorio: crearRepositorioArchivo("./data/usuarios.json"),
});
```

El archivo es una lista JSON. Si no existe, se crea al guardar el primer usuario. Si está vacío, equivale a una lista vacía. Si el contenido no es JSON o no es una lista, la lectura falla con un mensaje que incluye la ruta.

El repositorio de archivo está pensado para un solo proceso. Dos procesos escribiendo a la vez pueden pisarse el archivo.

## Uso por terminal

```bash
node src/cli.mjs ayuda
node src/cli.mjs crear --nombre "Ana López" --email ana@ejemplo.com --rol admin
node src/cli.mjs listar --rol admin --activo true --texto ana
node src/cli.mjs obtener <id>
node src/cli.mjs actualizar <id> --rol editor
node src/cli.mjs desactivar <id>
node src/cli.mjs activar <id>
node src/cli.mjs eliminar <id>
```

También vale `npm run usuarios -- listar`.

`--activo` solo acepta `true` o `false`. El archivo por defecto es `data/usuarios.json`, dentro del directorio desde el que se ejecuta el comando. Para usar otro archivo:

```bash
# PowerShell
$env:USUARIOS_ARCHIVO = "C:\datos\usuarios.json"
node src/cli.mjs listar
```

Los errores de datos salen por la salida de error y el proceso termina con código 1. Un comando que no existe termina con código 2.

## Pruebas

```bash
npm test
```

Eso ejecuta `node --test`. Hace falta Node 18 o superior.

- `test/servicio.test.mjs` cubre las reglas: alta, duplicados, filtros, actualización, estado y borrado.
- `test/repositorio.test.mjs` cubre el archivo JSON.
- `test/cli.test.mjs` ejecuta la terminal de verdad contra un archivo temporal.

## Dónde añadir algo nuevo

Un rol nuevo se agrega en `ROLES`, dentro de `src/usuarios/validacion.mjs`. La validación y el filtro lo toman de ahí.

Un dato nuevo, por ejemplo teléfono, se agrega en tres sitios: la validación, el objeto que arma `crear` en el servicio y la lista `CAMPOS_ACTUALIZABLES` si se puede editar. El repositorio guarda el objeto completo, así que no necesita una columna nueva.

Otro almacenamiento, por ejemplo una base de datos, se agrega como una función que devuelva el mismo contrato del repositorio:

- `guardar(usuario)`
- `buscarPorId(id)`
- `buscarPorEmail(email)`
- `listar()`
- `eliminar(id)` y devolver `true` si borró algo

Después se pasa con `crearServicioUsuarios({ repositorio })`. Las pruebas del servicio sirven igual si el repositorio cumple ese contrato.

Las contraseñas y las sesiones no forman parte de este gestor. El lugar para añadirlas es el servicio, dejando la comprobación de formato en la validación y el secreto fuera del objeto que se imprime en la terminal.
