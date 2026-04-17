# standardize_back_links.ps1
param (
    [string]$SearchDir = "paises",
    [bool]$DryRun = $false
)

$files = Get-ChildItem -Path $SearchDir -Filter "*.htm" -Recurse

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false

    # 1. Standardize VOLTAR / BACK link
    # Match various forms: <a ...>VOLTAR / BACK</a>
    $linkRegex = '(?s)<a\s+(?:[^>]*?\s+)?href="(?<href>[^"]*)"[^>]*>(?<text>\s*VOLTAR\s*/\s*BACK\s*)</a>'
    
    if ($content -match $linkRegex) {
        $href = $Matches[1]
        $text = $Matches[2]
        
        # Check if already in a footer
        if ($content -notmatch '<footer>\s*<a[^>]*>VOLTAR / BACK</a>\s*</footer>') {
            # Find the existing link and wrap it/replace it
            $newLink = "`n    <footer>`n        <a href=""$href"" class=""back-link"">$text</a>`n    </footer>"
            
            # If it's already inside a footer but maybe with different content, we'll try to refine
            if ($content -match '(?s)<footer>.*?VOLTAR / BACK.*?</footer>') {
                $content = [regex]::Replace($content, '(?s)<footer>.*?VOLTAR / BACK.*?</footer>', $newLink)
                $modified = $true
            } else {
                # Just replace the link itself with the footer-wrapped version
                # Usually it's at the end of body
                $content = $content -replace $linkRegex, $newLink
                $modified = $true
            }
        } else {
            # Already in footer, just ensure class is back-link
            if ($content -notmatch 'class="back-link"') {
                $content = $content -replace '(<a\s+[^>]*?class=")[^"]*(">[^<]*VOLTAR / BACK)', '$1back-link$2'
                $modified = $true
            }
        }
    }

    $bridgeScript = '
    <script>
      // Navigation Bridge for React Router
      document.addEventListener(''click'', (e) => {
        const link = e.target.closest(''a'');
        if (link && link.href && link.href.startsWith(window.location.origin)) {
          if (link.href.includes(''javascript'') || link.href.includes(''#'')) return;
          const path = link.href.replace(window.location.origin, '''');
          window.parent.postMessage({ type: ''NAVIGATE'', path }, ''*'');
        }
      });

      // Height Reporting for Auto-Resize
      const sendHeight = () => {
        window.parent.postMessage({ 
          type: ''RESIZE'', 
          height: document.documentElement.scrollHeight 
        }, ''*'');
      };
      window.addEventListener(''load'', sendHeight);
      window.addEventListener(''resize'', sendHeight);
      setTimeout(sendHeight, 500);
      setInterval(sendHeight, 2000);
    </script>'
    
    if ($content -notmatch 'Height Reporting for Auto-Resize') {
        if ($content -match '(?s)<script>.*?Navigation Bridge for React Router.*?</script>') {
            # Replace old bridge script
            $content = [regex]::Replace($content, '(?s)<script>.*?Navigation Bridge for React Router.*?</script>', $bridgeScript)
            $modified = $true
        } elseif ($content -match '</body>') {
            # Add new bridge script
            $content = $content -replace '</body>', "$bridgeScript`n</body>"
            $modified = $true
        } else {
            $content += $bridgeScript
            $modified = $true
        }
    }

    # 3. Ensure modern CSS link if needed
    # If the file doesn't have any of our modern CSS, add modern-legacy.css
    if ($content -notmatch 'team-page.css' -and $content -notmatch 'country-grid.css' -and $content -notmatch 'modern-legacy.css') {
        # Find head end and insert link
        if ($content -match '</head>') {
            $cssLink = "`n    <link rel=""stylesheet"" href=""/modern-legacy.css"">"
            $content = $content -replace '</head>', "$cssLink`n</head>"
            $modified = $true
        }
    }

    if ($modified) {
        if ($DryRun) {
            Write-Host "Would update: $($file.FullName)"
        } else {
            $content | Set-Content -Path $file.FullName -NoNewline
            Write-Host "Updated: $($file.FullName)"
        }
    }
}
