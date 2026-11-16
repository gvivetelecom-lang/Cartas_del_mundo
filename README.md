# Cartas del Mundo

Sitio de la carta diaria de noticias internacionales en español. Sitio estático (HTML, CSS y JavaScript) publicado con GitHub Pages, con base de datos y acceso por correo en Supabase.

## Estructura

```
index.html            Cáscara de la página
app.js                Toda la lógica del sitio (vistas, estado, acciones)
styles.css            Estilos
config.js             URL pública y clave pública (anon) de Supabase
supabase/migrations/  Esquema y funciones de la base, en orden
.nojekyll             Le indica a GitHub Pages que sirva los archivos tal cual
*.jpg, *.png, *.svg   Fotos y logos del sitio
```

`config.js` contiene solo la clave pública (anon). Es seguro que esté en el repositorio: la seguridad de los datos la dan las reglas RLS de la base, no el secreto de la clave. Nunca subas a este repositorio la clave `service_role` ni contraseñas.

## 1. Base de datos (Supabase)

Proyecto: `jvflixitaneicqraxhoq`. Para crear una base nueva desde cero, ejecutá en el SQL Editor, en este orden:

1. `supabase/migrations/001_base.sql`: tablas base, `es_admin()` y reglas RLS.
2. `supabase/migrations/002_web.sql`: cortesías, mensajes de contacto, funciones de suscripción, carta y archivo, y permisos.

Ambos scripts son idempotentes: se pueden volver a correr sin romper nada.

### Autenticación

En **Authentication → URL Configuration**:

- **Site URL:** `https://TU-USUARIO.github.io/cartas-del-mundo/`
- **Redirect URLs:** la misma dirección, y también `http://localhost:8000/` si pruebas en local.

En **Authentication → Providers → Email**, dejá activado el acceso por enlace (magic link).

Recomendado: configurar un SMTP propio en **Project Settings → Authentication → SMTP**. El SMTP por defecto de Supabase tiene límites bajos de envío y sus correos suelen caer en spam.

### Cómo se cargan las cartas

La carta de cada día es una fila en la tabla `cartas`: `fecha` (date, pk) e `items` (jsonb con 12 temas). Cada tema tiene esta forma:

```json
{
  "sec": "paraguay",
  "t": "Título en español",
  "p": "Párrafo de hechos (3 a 5 frases).",
  "porque": "Por qué importa (2 a 3 frases).",
  "fuentes": "ABC Color · https://…  |  Reuters · https://…",
  "pt": { "t": "Título en portugués", "p": "…", "porque": "…" },
  "en": { "t": "Title in English", "p": "…", "porque": "…" }
}
```

Secciones válidas en `sec`: `paraguay`, `internacional`, `economia`, `ciencia`, `historia`, `america`. Los campos `pt` y `en` son opcionales; si faltan, se muestra el español.

Las cartas de los últimos 7 días son visibles para todas las personas. Las anteriores solo muestran el primer tema completo, salvo para las suscriptoras activas y las cortesías.

### Gestión de suscriptoras

La administradora entra con `ancorvalan.a@gmail.com` (por enlace de un solo uso) y ve la pestaña **Gestión**. Ahí confirma pedidos, da de baja, agrega cortesías, lee mensajes y solicitudes de eliminación de datos.

## 2. GitHub Pages

1. Crear el repositorio `cartas-del-mundo` (público, para que Pages sea gratis).
2. Subir todos los archivos de esta carpeta, incluido `.nojekyll`.
3. En **Settings → Pages**: fuente **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. Esperar un minuto y abrir `https://TU-USUARIO.github.io/cartas-del-mundo/`.

Si la URL cambia, actualizala también en Supabase (ver “Autenticación”).

## 3. Textos legales (ocultos por ahora)

Las páginas Privacidad, Términos, Reembolsos y Cookies **no se muestran** en el sitio: se quitaron del pie de página, de la casilla de aceptación y del aviso de cookies, y sus rutas ya no existen. Los textos están en el documento de revisión “Textos legales de Cartas del Mundo (para revisar)”.

Para publicarlas más adelante hay que volver a agregar los enlaces y las rutas (`vPrivacidad`, `vTerminos`, `vReembolso`, `vCookies` en `app.js`, y la tabla `RUTAS`), y completar los marcadores entre corchetes que tienen los textos.

## 4. Probar en local

```bash
cd cartas-del-mundo
python3 -m http.server 8000
```

Abrir `http://localhost:8000/`. Para el acceso por correo hace falta que `localhost:8000` esté en las Redirect URLs de Supabase.

## Notas de seguridad

- Las funciones que cambian datos (`solicitar_suscripcion`, `cancelar_mi_suscripcion`) solo las puede ejecutar una usuaria con sesión.
- `carta_por_fecha` y `archivo_cartas` son públicas a propósito: filtran el contenido dentro de la base. El aviso de “SECURITY DEFINER callable by anon” que muestran los advisors de Supabase para estas dos funciones es esperado.
- Los pedidos de suscripción se confirman a mano desde la pestaña Gestión. Ninguna suscripción pasa a “activa” sin esa confirmación, salvo las cortesías que agrega la administradora.
