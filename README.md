# EDOCENTIA

Portal de herramientas para el trabajo docente, creado por Ana Hernández Iranzo. La web reúne las herramientas originales de EDOCENTIA y una biblioteca de recursos externos con atribución y licencia declarada.

## Estructura

- `index.html`: portada con titular animado al cargar, juguete interactivo con una pila de libros, plantas y esferas que saltan, mapa de nueve herramientas y acceso a demos destacadas.
- `apps.html`: catálogo visual con búsqueda y filtro por área; muestra cinco recursos de idiomas de Ana H. Iranzo y Felip Sarroca.
- `data/apps.json`: selección de fichas del repositorio comunitario Vibe Coding Educativo con licencias que incluyen una cláusula de compartir igual (CC BY-SA y CC BY-NC-SA).
- `modulo-*`: herramientas docentes de EDOCENTIA.
- `app-ia.html`, `app-prompts.html`, `app-rubricas.html`: herramientas complementarias.
- `normativa-cv/`: recursos de normativa docente de la Comunitat Valenciana.
- `assets/`: estilos, navegación compartida y lógica de la portada y el catálogo. La portada incluye sonidos de teclado generados localmente, un juguete Canvas accesible y un mapa interactivo de herramientas. `data/apps.json` conserva las 108 fichas de origen; el catálogo muestra la unidad de inglés de Ana H. Iranzo y cuatro recursos de idiomas de Felip Sarroca.

## Catálogo abierto y atribución

Las fichas de `data/apps.json` se han seleccionado del [Repositorio de recursos educativos digitales de Vibe Coding Educativo](https://github.com/Vibe-Coding-Educativo/app_edu), consultado el 3 de noviembre de 2026. Se conservan el título, la descripción, el enlace, el autor y la licencia declarada por cada recurso. La selección incluye licencias CC BY-SA y CC BY-NC-SA; algunas fichas distinguen entre AGPL para el código y CC BY-SA para los contenidos. La página muestra esas licencias sin sustituirlas por una licencia única ni eliminar las restricciones de uso comercial.

La biblioteca aloja las fichas, no copia ni vuelve a publicar las aplicaciones enlazadas. Las aplicaciones se abren en los sitios de sus autores. La unidad propia de inglés no declara una licencia de reutilización; no se le atribuye una licencia Creative Commons.

## Vista local

Sirve la carpeta desde un servidor HTTP local (por ejemplo, `python -m http.server 8080`) y abre `http://localhost:8080`. El catálogo carga su archivo JSON local, por lo que no debe abrirse como archivo `file://`.

GitHub Pages puede publicar el sitio desde la raíz de la rama principal.
