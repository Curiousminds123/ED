const appList = document.querySelector('#app-list');
const searchInput = document.querySelector('#catalog-search');
const areaFilter = document.querySelector('#area-filter');
const authorFilter = document.querySelector('#author-filter');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const loadError = document.querySelector('#load-error');
const pagination = document.querySelector('#pagination');
const previousPage = document.querySelector('#previous-page');
const nextPage = document.querySelector('#next-page');
const pageStatus = document.querySelector('#page-status');
const pageSize = 24;
let currentPage = 1;

function appendText(parent, tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function licenseUrl(part) {
  const normalized = part
    .replace(/^Creative Commons\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/CC-?/i, 'CC ')
    .replace(/-(\d+\.\d)$/, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
  const cc = normalized.match(/(?:CC\s*)?(BY(?:-NC)?-SA)(?:\s+(\d+\.\d))?/i);
  if (cc) {
    return cc[2]
      ? `https://creativecommons.org/licenses/${cc[1].toLowerCase()}/${cc[2]}/deed.es`
      : 'https://creativecommons.org/share-your-work/cclicenses/';
  }
  if (/AGPL/i.test(part)) return 'https://www.gnu.org/licenses/agpl-3.0.html';
  return '';
}

function renderLicense(parent, license) {
  appendText(parent, 'span', 'license-label', 'Licencia declarada');
  const parts = document.createElement('div');
  parts.className = 'license-list';
  license.split(/[·;]/).map((part) => part.trim()).filter(Boolean).forEach((part, index, all) => {
    const url = licenseUrl(part);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = part;
      parts.append(link);
    } else {
      parts.append(document.createTextNode(part));
    }
    if (index < all.length - 1) parts.append(document.createTextNode(' · '));
  });
  parent.append(parts);
}

function createAppCard(app) {
  const card = document.createElement('article');
  card.className = app.isOwn ? 'app-card app-card-own' : 'app-card';
  const artwork = document.createElement('div');
  artwork.className = 'app-card-art';
  artwork.setAttribute('aria-hidden', 'true');
  appendText(artwork, 'span', 'app-card-art-mark', app.visualMark || (app.title || '✳').trim().slice(0, 1).toUpperCase());
  card.append(artwork);

  const content = document.createElement('div');
  content.className = 'app-card-content';
  card.append(content);
  appendText(content, 'h3', '', app.title);
  appendText(content, 'p', 'app-author', `Por ${app.author}`);
  appendText(content, 'p', 'app-description', app.description || 'La ficha no incluye una descripción.');

  if (app.license || app.isOwn) {
    const license = document.createElement('div');
    license.className = 'app-license';
    if (app.isOwn) {
      appendText(license, 'span', 'license-label', 'Recurso propio');
      appendText(license, 'div', 'license-list', 'No se indica una licencia de reutilización');
    } else renderLicense(license, app.license);
    content.append(license);
  }

  const open = document.createElement('a');
  open.className = 'app-open';
  open.href = app.url;
  if (/^https?:\/\//i.test(app.url)) {
    open.target = '_blank';
    open.rel = 'noopener';
  }
  open.append(document.createTextNode('Abrir recurso'));
  appendText(open, 'span', '', '↗');
  content.append(open);
  return card;
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

function getAreas(app) {
  return String(app.area || '').split(/[,;|]/).map((area) => area.trim()).filter(Boolean);
}

function isFeaturedAuthor(author) {
  const normalized = normalize(author).replace(/\./g, '').trim();
  return /^felip sarroca(?:\s+i\s+gil)?$/.test(normalized);
}

function isLanguageResource(app) {
  return String(app.area || '').split(/[,;|]/).some((area) => normalize(area.trim()) === 'idiomas');
}

const featuredResources = [
  {
    title: 'App italiano A2–C1 · ayuda en español',
    author: 'Ana H. Iranzo',
    description: 'Una app para practicar italiano de A2 a C1 con apoyo en español.',
    area: 'Idiomas',
    type: 'Italiano',
    url: 'https://curiousminds123.github.io/App-italiano-A2-C1-ayuda-espano/',
    visualMark: 'IT'
  },
  {
    title: 'English Steps · A1–A2',
    author: 'Ana H. Iranzo',
    description: 'Actividades interactivas para practicar inglés en niveles A1–A2.',
    area: 'Idiomas',
    type: 'Inglés',
    url: 'https://curiousminds123.github.io/APP-ingl-s-A1-A2/',
    visualMark: 'EN'
  },
  {
    title: 'Observatorio de noticias',
    author: 'Ana H. Iranzo',
    description: 'Un observatorio con noticias y actualidad para seguir aprendiendo.',
    area: 'Actualidad',
    type: 'Noticias',
    url: 'https://curiousminds123.github.io/APP-NOTICIAS/',
    visualMark: 'N'
  },
  {
    title: 'Tarjetas a debate · IA en educación',
    author: 'Ana H. Iranzo',
    description: 'Tarjetas para conversar y debatir sobre la inteligencia artificial en educación.',
    area: 'Educación',
    type: 'Debate',
    url: 'https://curiousminds123.github.io/Tarjetas-IA-a-debate-docente/',
    visualMark: 'IA'
  },
  {
    title: 'Inglés B2.1–B2.2',
    author: 'Ana H. Iranzo',
    description: 'Recursos interactivos para practicar inglés en niveles B2.1–B2.2.',
    area: 'Idiomas',
    type: 'Inglés',
    url: 'https://curiousminds123.github.io/App-ingles-b2.1-b2.2/',
    visualMark: 'EN'
  },
  {
    title: 'AULAFLIX',
    author: 'Ana H. Iranzo',
    description: 'Un espacio audiovisual para descubrir contenidos y propuestas para el aula.',
    area: 'Audiovisual',
    type: 'Recursos de aula',
    url: 'https://curiousminds123.github.io/AULAFLIX-/',
    visualMark: '▶'
  },
  {
    title: 'Volums · Aprèn a calcular volums',
    author: 'Felip Sarroca',
    description: 'Aprèn a calcular volums amb propostes interactives.',
    area: 'Matemáticas',
    type: 'Geometría',
    url: 'https://felipsarroca.github.io/edu-apps/Volums/',
    visualMark: 'V'
  },
  {
    title: 'Demos: machines, games and art, built with AI',
    author: 'Techartist',
    description: 'Experimentos de máquinas, juegos y arte construidos con IA.',
    area: 'Arte y tecnología',
    type: 'Colección',
    url: 'https://iamtechartist.com/demos/',
    visualMark: '✳'
  },
  {
    title: 'Playlist: original songs by Techartist',
    author: 'Techartist',
    description: 'Escucha una selección de canciones originales de Techartist.',
    area: 'Música',
    type: 'Playlist',
    url: 'https://iamtechartist.com/playlist/#undo-undo',
    visualMark: '♫'
  },
  {
    title: 'Electronics 101 — hands-on 3D lessons for beginners',
    author: 'Electronics 101',
    description: 'Lecciones prácticas en 3D para descubrir fundamentos de electrónica.',
    area: 'Ciencia y tecnología',
    type: 'Electrónica',
    url: 'https://electronics-101-six.vercel.app/',
    visualMark: '⌁'
  },
  {
    title: 'Art Map · PAU 2026',
    author: 'Aaron Fortuño',
    description: 'Mapa interactivo para explorar arte y contenidos de la PAU 2026.',
    area: 'Arte',
    type: 'PAU 2026',
    url: 'https://aaronfortuno.github.io/art-map/',
    visualMark: 'A'
  },
  {
    title: 'El viaje de Magallanes y Elcano · Primera vuelta al mundo',
    author: 'Felip Sarroca',
    description: 'Recorrido interactivo por el viaje de Magallanes y Elcano y la primera vuelta al mundo.',
    area: 'Ciencias sociales',
    type: 'Historia',
    url: 'https://felipsarroca.github.io/edu-apps/VoltaMon/#sevilla',
    visualMark: '↗'
  },
  {
    title: 'El Renacimiento',
    author: 'Felip Sarroca',
    description: 'Unidad interactiva para explorar el arte y el humanismo del Renacimiento.',
    area: 'Ciencias sociales, Arte',
    type: 'Historia del arte',
    url: 'https://felipsarroca.github.io/web/Renaixement/',
    visualMark: 'R'
  },
  {
    title: 'Arduino Uno R3 — Robotics Lab',
    author: 'Robotics Lab',
    description: 'Laboratorio interactivo para explorar la placa Arduino Uno R3 y la robótica.',
    area: 'Ciencia y tecnología',
    type: 'Robótica',
    url: 'https://robotics-lab-app.vercel.app/#uno',
    visualMark: 'R'
  },
  {
    title: 'DNA & the Genetic Code',
    author: 'Techartist',
    description: 'Explora el ADN y el código genético.',
    area: 'Biología',
    type: 'Genética',
    url: 'https://iamtechartist.com/dna-and-the-genetic-code/',
    visualMark: 'DNA'
  },
  {
    title: 'Platón · Filosofía',
    author: 'Ana H. Iranzo',
    description: 'Cuaderno de NotebookLM sobre Platón y filosofía, creado por Ana H. Iranzo.',
    area: 'Filosofía',
    type: 'NotebookLM',
    url: 'https://notebook.google.com/notebook/3684293d-e1a7-45ef-a876-fc80d70d5f9e',
    visualMark: 'PL'
  },
  {
    title: 'El modelo atómico',
    author: 'Ana H. Iranzo',
    description: 'Cuaderno de NotebookLM sobre el modelo atómico, creado por Ana H. Iranzo.',
    area: 'Ciencia y tecnología',
    type: 'NotebookLM',
    url: 'https://notebooklm.link.google/4BSsrfT4pWWZ',
    visualMark: 'MA'
  }
];

const featuredLanguageApps = [
  {
    title: 'Unit 6 · Inglés B1.1',
    author: 'Ana H. Iranzo',
    description: 'Unidad interactiva de inglés para el nivel B1.1.',
    area: 'Idiomas',
    level: 'B1.1',
    type: 'Inglés',
    url: 'https://curiousminds123.github.io/UNIT6B1.1/',
    visualMark: 'EN',
    isOwn: true
  }
];

function renderApps(apps) {
  const query = normalize(searchInput.value.trim());
  const area = normalize(areaFilter.value);
  const author = normalize(authorFilter.value);
  const filtered = apps.filter((app) => {
    const matchesArea = !area || getAreas(app).some((item) => normalize(item) === area);
    const matchesAuthor = !author || normalize(app.author) === author;
    const searchable = normalize([
      app.title, app.author, app.description, app.area, app.level, app.tags, app.type, app.platform, app.license
    ].join(' '));
    return matchesArea && matchesAuthor && (!query || searchable.includes(query));
  });

  const pageCount = Math.ceil(filtered.length / pageSize);
  currentPage = Math.min(currentPage, Math.max(pageCount, 1));
  const start = (currentPage - 1) * pageSize;
  appList.replaceChildren(...filtered.slice(start, start + pageSize).map(createAppCard));
  resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'recurso' : 'recursos'}`;
  emptyState.hidden = filtered.length !== 0;
  pagination.hidden = pageCount <= 1;
  pageStatus.textContent = `Página ${currentPage} de ${pageCount}`;
  previousPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= pageCount;
}

async function loadCatalog() {
  try {
    const response = await fetch('data/apps.json');
    if (!response.ok) throw new Error(`No se pudo leer el catálogo (${response.status}).`);
    const catalog = await response.json();
    if (!Array.isArray(catalog.apps)) throw new Error('El formato del catálogo no es válido.');
    const featuredApps = [
      ...featuredLanguageApps,
      ...featuredResources,
      ...catalog.apps.filter((app) => (
        isFeaturedAuthor(app.author)
        && isLanguageResource(app)
        && normalize(app.title) !== 'joc del penjat'
      ))
    ];

    const areas = new Set();
    const authors = new Set();
    featuredApps.forEach((app) => {
      getAreas(app).forEach((area) => areas.add(area));
      if (app.author) authors.add(app.author.trim());
    });
    [...areas].sort((a, b) => a.localeCompare(b, 'es')).forEach((area) => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      areaFilter.append(option);
    });
    [...authors].sort((a, b) => a.localeCompare(b, 'es')).forEach((author) => {
      const option = document.createElement('option');
      option.value = author;
      option.textContent = author;
      authorFilter.append(option);
    });

    searchInput.addEventListener('input', () => {
      currentPage = 1;
      renderApps(featuredApps);
    });
    [areaFilter, authorFilter].forEach((filter) => filter.addEventListener('change', () => {
      currentPage = 1;
      renderApps(featuredApps);
    }));
    previousPage.addEventListener('click', () => {
      currentPage -= 1;
      renderApps(featuredApps);
    });
    nextPage.addEventListener('click', () => {
      currentPage += 1;
      renderApps(featuredApps);
    });
    renderApps(featuredApps);
    appList.setAttribute('aria-busy', 'false');
  } catch (error) {
    appList.setAttribute('aria-busy', 'false');
    appList.hidden = true;
    resultCount.textContent = 'Biblioteca no disponible';
    loadError.hidden = false;
    console.error('Error al cargar la biblioteca de aplicaciones:', error);
  }
}

loadCatalog();
