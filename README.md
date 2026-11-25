# Gestor de usuarios

Alta, consulta, modificación y baja de usuarios. Las reglas viven en el servicio, y los datos pueden guardarse en memoria o en un archivo JSON.

La explicación de la estructura, las reglas y los comandos está en [docs/como-funciona.md](docs/como-funciona.md).

```bash
npm test
node src/cli.mjs ayuda
node src/cli.mjs crear --nombre "Ana López" --email ana@ejemplo.com --rol admin
node src/cli.mjs listar
```
