DYNAMICORE - SISTEMA DE PAGOS

Prueba tecnica. Permite crear usuarios, registrar tarjetas ficticias y hacer pagos.
Usa PostgreSQL, Node.js (API REST) y Python (simulador de pagos).


QUE HACE EL PROYECTO

- El API en Node.js recibe las peticiones (usuarios, tarjetas, pagos).
- Cuando se crea un pago, Node llama al servicio Python.
- Python responde si el pago fue aprobado o rechazado (aprox. 80% aprobado, 20% rechazado).
- Todo se guarda en PostgreSQL.
- Hay una pagina web en http://localhost:3000 para usar el sistema sin Postman.
- Tambien puedes probar con Postman o curl.


ENTREGABLES Y DONDE ESTAN

1. Codigo fuente
   - API Node.js: carpeta api/
   - Servicio Python: carpeta payment-service/
   - Base de datos: database/init.sql (tablas)
   - Opcional: database/setup-local.sql (crear usuario y base en Postgres local)
   - Opcional: docker-compose.yml (levantar Postgres con Docker)

2. Coleccion Postman
   - postman/Dynamicore-Payments.postman_collection.json

3. Instrucciones (este archivo)
   - README.md en la raiz del proyecto

4. Variables de entorno de ejemplo
   - .env.example (copiar a .env y ajustar)

5. Repositorio en GitHub
   - Debes crear el repo publico y subir este proyecto.
   - Este README es la guia de instalacion y pruebas.


REQUISITOS

- Node.js 18 o superior
- Python 3.10 o superior
- PostgreSQL 14 o superior (o Docker para la base de datos)


ESTRUCTURA DE CARPETAS

dynamicore/
  api/                  API y pagina web (Node.js)
  payment-service/      Procesador de pagos (Python)
  database/             Scripts SQL
  postman/              Coleccion Postman
  docker-compose.yml    Postgres en Docker (opcional)
  .env.example          Ejemplo de configuracion
  README.md             Este archivo


INSTALACION PASO A PASO

Paso 1. Clonar el repositorio

  git clone <url-de-tu-repositorio>
  cd dynamicore

Paso 2. Configurar variables

  Copia .env.example a .env y editalo si hace falta.

  Valores habituales:
  - Base de datos: postgresql://dynamicore:dynamicore@localhost:5432/dynamicore_payments
  - API Node: puerto 3000
  - Servicio Python: puerto 8000 (o el que uses, y ponlo en PAYMENT_SERVICE_URL)

Paso 3. Base de datos

  Opcion A - Con Docker:

    docker compose up -d

    El archivo database/init.sql se aplica solo al crear el contenedor.

  Opcion B - Postgres instalado en tu PC:

    Crear usuario y base (como administrador postgres):

      psql -U postgres -c "CREATE USER dynamicore WITH PASSWORD 'dynamicore';"
      psql -U postgres -c "CREATE DATABASE dynamicore_payments OWNER dynamicore;"

    Crear tablas:

      En Windows PowerShell:
      $env:PGPASSWORD='dynamicore'
      psql -U dynamicore -d dynamicore_payments -f database\init.sql

      En Linux o Mac:
      PGPASSWORD=dynamicore psql -U dynamicore -d dynamicore_payments -f database/init.sql

Paso 4. Servicio Python (una terminal)

  cd payment-service
  python -m venv venv

  Activar entorno:
  Windows:  venv\Scripts\activate
  Linux/Mac: source venv/bin/activate

  pip install -r requirements.txt
  uvicorn app:app --reload --port 8000

  Comprobar: http://localhost:8000/health
  Documentacion API Python: http://localhost:8000/docs

  Si el puerto 8000 esta ocupado, usa otro (ej. 8001) y en .env pon:
  PAYMENT_SERVICE_URL=http://localhost:8001

Paso 5. API Node.js (otra terminal)

  cd api
  npm install
  npm run dev

  Comprobar: http://localhost:3000/health

Paso 6. Usar la interfaz web

  Abre en el navegador: http://localhost:3000

  Desde ahi puedes crear usuarios, tarjetas y pagos.
  La web llama al mismo API REST (/api/...), no escribe directo en la base de datos.


ENDPOINTS DEL API (JSON)

  GET    /health
         Estado del servidor.

  POST   /api/usuarios
         Crear usuario. Body: nombre, email

  GET    /api/usuarios
         Listar usuarios.

  GET    /api/usuarios/:id
         Ver un usuario.

  POST   /api/usuarios/:id/tarjetas
         Registrar tarjeta ficticia.
         Body: numero_tarjeta, titular, mes_vencimiento, anio_vencimiento, marca (opcional)
         Solo se guardan los ultimos 4 digitos del numero.

  GET    /api/usuarios/:id/tarjetas
         Listar tarjetas del usuario.

  POST   /api/pagos
         Crear pago. Body: usuario_id, tarjeta_id, monto
         Llama a Python y guarda estado aprobado o rechazado.

  GET    /api/pagos/usuarios/:id
         Historial de pagos del usuario.


PAGINAS WEB (HTML)

  GET /
         Listado de usuarios.

  GET /usuarios/nuevo
         Formulario para crear usuario.

  GET /usuarios/:id
         Detalle del usuario, tarjetas, pagos y formularios.


POSTMAN

  1. Abre Postman.
  2. Importa el archivo postman/Dynamicore-Payments.postman_collection.json
  3. Variable baseUrl debe ser http://localhost:3000
  4. Ejecuta en orden: Crear usuario, Registrar tarjeta, Crear pago, Historial.
     Las variables usuarioId y tarjetaId se guardan solas en la coleccion.


TABLAS EN POSTGRESQL

  usuarios: id, nombre, email, created_at

  tarjetas: id, usuario_id, ultimos_cuatro, titular, marca,
            mes_vencimiento, anio_vencimiento, created_at

  pagos: id, usuario_id, tarjeta_id, monto, estado, created_at
         estado puede ser: pendiente, aprobado, rechazado


COMO FUNCIONA UN PAGO

  1. El cliente envia POST /api/pagos con usuario, tarjeta y monto.
  2. Node valida que el usuario y la tarjeta existan y coincidan.
  3. Se guarda el pago como pendiente.
  4. Node llama POST /process al servicio Python con el monto.
  5. Python responde aprobado o rechazado (aleatorio 80/20).
  6. Node actualiza el pago en la base de datos y devuelve el resultado.


IMPORTANTE

  Usa solo numeros de tarjeta de prueba, por ejemplo 4111111111111111.
  No uses tarjetas reales. El numero completo no se guarda en la base de datos.



