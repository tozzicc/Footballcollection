import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import * as cheerio from 'cheerio';
import { execSync } from 'child_process';

const CSS_PATH = '/modern-legacy.css';
const INITIAL_COMMIT = 'd1013576';

function getOriginalContent(filePath) {
  try {
    let gitPath = filePath.replace(/\\/g, '/');
    try {
      return execSync(`git show ${INITIAL_COMMIT}:"${gitPath}"`, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'latin1' });
    } catch (e) {
      if (gitPath.startsWith('public/')) {
        const altPath = gitPath.substring(7);
        return execSync(`git show ${INITIAL_COMMIT}:"${altPath}"`, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'latin1' });
      }
      throw e;
    }
  } catch (e) { return null; }
}

function cleanCaption(text) {
  if (!text) return "";
  return text.replace(/[ \t]+/g, ' ').split('\n').map(s => s.trim()).filter(Boolean).join('\n').replace(/\s+/g, ' ').trim();
}

async function modernizeFile(filePath) {
  console.log(`Modernizing: ${filePath}`);
  let raw = getOriginalContent(filePath);
  if (!raw) { raw = fs.readFileSync(filePath, 'latin1'); }
  let content = raw.toString('latin1');
  content = content.replace(/&nbsp;/g, ' ');
  const $ = cheerio.load(content, { decodeEntities: false });

  // 1. Extract Title (Year-first logic)
  const fileName = path.basename(filePath, '.htm');
  let title = fileName;
  if (!/^\d{4}$/.test(title)) {
      title = $('title').text().trim();
      if (!title || title === "Inicial") {
          const headingText = $('b i font, font b i, h1, h2, b font[size="5"]').first().text().trim();
          if (headingText) title = headingText;
      }
  }
  title = title.replace(/\s+/g, ' ').substring(0, 150) || 'Football Collection';

  // 2. Data Extraction
  const items = [];
  $('img').each((i, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    if (!src || src.includes('contador') || src.includes('f2.jpg') || src.includes('fundo') || src.includes('Picture0001')) return;
    if (src.toLowerCase().includes('logo') || src.toLowerCase().includes('bandeira')) return;

    let caption = "";
    const $td = $img.closest('td');
    caption = cleanCaption($td.text());

    if (caption.length < 3 && $td.length) {
      const colIdx = $td.parent().children().index($td);
      const $nextRow = $td.parent().next();
      if ($nextRow.length) {
        const $cellBelow = $nextRow.children().eq(colIdx);
        if ($cellBelow.length && !($cellBelow.find('img').length)) {
          caption = cleanCaption($cellBelow.text());
        }
      }
      if (caption.length < 3) {
        let $next = $td.closest('table').next();
        while ($next.length && !$next.is('table') && $next.text().trim().length < 5) {
          $next = $next.next();
        }
        if ($next.length && $next.is('table')) {
          caption = cleanCaption($next.text());
        }
      }
    }

    if (items.find(it => it.src === src)) return;

    const w = parseInt($img.attr('width') || '0');
    const h = parseInt($img.attr('height') || '0');
    const isLandscape = w > h && w > 0;
    const hasTeamKeyword = caption.toUpperCase().includes('TIME') || caption.toUpperCase().includes('TEAM') || src.toLowerCase().includes('time');
    
    const isTeam = hasTeamKeyword || (isLandscape && items.length === 0);
    const href = $img.closest('a').attr('href');

    items.push({ src, caption: caption || '', href, isTeam });
  });

  // 3. Grouping Logic
  const teamItems = items.filter(it => it.isTeam);
  const otherItems = items.filter(it => !it.isTeam);
  const shirtGroups = [];
  for (let i = 0; i < otherItems.length; i += 3) {
    shirtGroups.push(otherItems.slice(i, i + 3));
  }

  // 4. Navigation Links
  const linkItems = [];
  $('a').each((i, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      let text = $a.text().trim();
      if (!href || !text || text.length < 2) return;
      const upText = text.toUpperCase();
      if (['BACK', 'VOLTAR', 'ENTER', 'LOGO', 'INICIAL'].includes(upText) || upText.includes('COLLECTION')) return;
      if (href.includes('javascript') || href.startsWith('http')) return;
      if (!linkItems.find(it => it.href === href)) linkItems.push({ href, text });
  });

  const decades = {};
  linkItems.forEach(link => {
      const yearMatch = link.text.match(/^(\d{4})$/);
      if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const decade = Math.floor(year / 10) * 10;
          if (!decades[decade]) decades[decade] = [];
          decades[decade].push(link);
      }
  });

  // 5. Render
  const teamHtml = teamItems.map(item => `
    <div class="team-section">
      <div class="item">
          ${item.href ? `<a href="${item.href}">` : ''}
          <div class="image-wrapper team-image">
            <img src="${item.src}" alt="Team" loading="lazy">
          </div>
          ${item.href ? `</a>` : ''}
          <!-- Caption removed from inside image as requested -->
      </div>
    </div>
  `).join('');

  const groupsHtml = shirtGroups.map(group => {
    // Get the most meaningful caption (the one that isn't empty or "Item")
    const groupCaption = group.find(it => it.caption && it.caption !== 'Item')?.caption || '';
    return `
    <div class="shirt-group">
      <div class="group-items">
        ${group.map(item => `
          <div class="item">
              ${item.href ? `<a href="${item.href}">` : ''}
              <div class="image-wrapper">
                <img src="${item.src}" alt="Item" loading="lazy">
              </div>
              ${item.href ? `</a>` : ''}
              <!-- Individual caption removed as requested -->
          </div>
        `).join('')}
      </div>
      ${groupCaption ? `<div class="group-caption">${groupCaption}</div>` : ''}
    </div>
  `}).join('');

  const sortedDecades = Object.keys(decades).sort((a, b) => parseInt(a) - parseInt(b));
  const decadesHtml = sortedDecades.map(decade => `
    <div class="decade-section">
        <div class="decade-title">${decade}s</div>
        <div class="link-grid">
            ${decades[decade].map(link => `<a href="${link.href}" class="nav-button">${link.text}</a>`).join('')}
        </div>
    </div>
  `).join('');

  const newHtml = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${CSS_PATH}">
</head>
<body class="legacy-page">
    <header>
        <h1>${title}</h1>
    </header>
    <main>
        ${teamHtml}
        ${groupsHtml}
        ${decadesHtml}
    </main>
    <footer>
        <a href="javascript:history.back()" class="back-link">VOLTAR / BACK</a>
    </footer>
    <script>
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
          if (link.href.includes('javascript') || link.href.includes('#')) return;
          const path = link.href.replace(window.location.origin, '');
          window.parent.postMessage({ type: 'NAVIGATE', path }, '*');
        }
      });
      const sh = () => { window.parent.postMessage({ type: 'RESIZE', height: document.documentElement.scrollHeight }, '*'); };
      window.addEventListener('load', sh); window.addEventListener('resize', sh); setTimeout(sh, 500);
    </script>
</body>
</html>`;

  fs.writeFileSync(filePath, newHtml, 'utf-8');
}

async function run() {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        for (const file of args) { await modernizeFile(file); }
    } else {
        const files = await glob('**/*.htm', { ignore: ['node_modules/**', 'dist/**', 'index.htm', 'content.htm', 'bemvindo.htm', 'welcome.htm', 'benvenuto.htm'] });
        console.log(`Found ${files.length} files to modernize.`);
        for (const file of files) { await modernizeFile(file); }
    }
    console.log('Modernization Success!');
}

run();
