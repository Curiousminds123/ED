const portalScript = document.currentScript;

if (portalScript) {
  const siteRoot = new URL('../', portalScript.src);
  const hasSiteHeader = Boolean(document.querySelector('.site-header'));
  if (!hasSiteHeader) {
    const theme = document.createElement('link');
    theme.rel = 'stylesheet';
    theme.href = new URL('assets/theme.css', siteRoot).href;
    document.head.append(theme);
  }

  if (!hasSiteHeader) {
    const navigation = document.createElement('nav');
    navigation.className = 'portal-shortcuts';
    navigation.setAttribute('aria-label', 'Navegación EDOCENTIA');

    [
      { href: 'index.html', label: 'EDOCENTIA' },
      { href: 'apps.html', label: 'Biblioteca abierta' }
    ].forEach(({ href, label }) => {
      const link = document.createElement('a');
      link.href = new URL(href, siteRoot).href;
      link.textContent = label;
      navigation.append(link);
    });

    document.body.append(navigation);
  }

  if (!hasSiteHeader) {
    const signature = document.createElement('div');
    signature.className = 'creator-signature';
    signature.setAttribute('role', 'note');
    signature.textContent = 'Creado por Ana H. Iranzo asistida con IA.';
    document.body.append(signature);
  }
}
