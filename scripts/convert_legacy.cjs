const fs = require('fs');
const path = require('path');

const baseDir = path.join('c:', 'Projetos', 'Football Collection', 'public', 'paises');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.htm') || file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(baseDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('<table')) {
        let title = '';
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) title = titleMatch[1];
        
        let allNewGroups = '';
        
        // Find tables with images - USING PROPER NODE.JS DOTALL FLAG
        const tableGroups = content.match(/<table[^>]*>.*?<img.*?<\/table>/gs);
        
        if (tableGroups) {
            console.log(`Converting: ${file}`);
            tableGroups.forEach(tableHtml => {
                // Extract images
                const imgMatches = [...tableHtml.matchAll(/src="([^"]*)"/g)];
                let imgList = '';
                imgMatches.forEach(match => {
                    const src = match[1];
                    imgList += `          <div class="item"><div class="image-wrapper"><img src="${src}" loading="lazy"></div></div>\n`;
                });
                
                // Find caption (search in content after this table)
                const startIndex = content.indexOf(tableHtml) + tableHtml.length;
                const remaining = content.substring(startIndex);
                let caption = '';
                
                // Look for the next table with text - PROPER DOTALL
                const captionMatch = remaining.match(/^\s*(?:<hr>)?\s*<table[^>]*>.*?<div[^>]*>(.*?)<\/div>.*?<\/table>/is);
                if (captionMatch) {
                    const captionHtml = captionMatch[1];
                    caption = captionHtml.replace(/<[^>]*>/g, '').trim();
                    // Fix some entities
                    caption = caption.replace(/&Atilde;/g, 'Ã').replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú').replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç');
                }
                
                if (imgList) {
                    allNewGroups += `    <div class="shirt-group"><div class="group-items">\n${imgList}</div><div class="group-caption">${caption}</div></div>\n`;
                }
            });
        }
        
        if (allNewGroups) {
            const footerMatch = content.match(/<footer>.*?<\/footer>/is);
            const scriptMatch = content.match(/<script>.*?<\/script>/is);
            
            const finalContent = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/modern-legacy.css">
</head>
<body class="legacy-page align-left">
<header><h1>${title}</h1></header>
<main>${allNewGroups}</main>
${footerMatch ? footerMatch[0] : ''}
${scriptMatch ? scriptMatch[0] : ''}
</body>
</html>`;
            
            fs.writeFileSync(file, finalContent, 'utf8');
        }
    }
});

console.log('Conversion complete!');
