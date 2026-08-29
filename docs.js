(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const storedTheme = localStorage.getItem('tessella-theme');
  const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  let theme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : preferredTheme;

  const applyTheme = (nextTheme) => {
    theme = nextTheme;
    root.dataset.theme = theme;
    localStorage.setItem('tessella-theme', theme);
    themeButton?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };

  applyTheme(theme);
  themeButton?.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));

  document.querySelectorAll('.code-block').forEach((block) => {
    const code = block.querySelector('code');
    if (!code) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', `Copy ${block.dataset.language || 'code'} example`);
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        button.textContent = 'Copied';
        button.classList.add('is-copied');
        window.setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('is-copied');
        }, 1600);
      } catch {
        button.textContent = 'Select';
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
    block.append(button);
  });

  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const mobileToc = document.getElementById('mobile-toc');

  const setActiveSection = (id) => {
    links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
    if (mobileToc && mobileToc.value !== `#${id}`) mobileToc.value = `#${id}`;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    },
    { rootMargin: '-18% 0px -70% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
  if (sections[0]) setActiveSection(sections[0].id);

  mobileToc?.addEventListener('change', (event) => {
    const target = document.querySelector(event.target.value);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
