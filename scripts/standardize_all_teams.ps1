
# standardize_all_teams.ps1
# Automates modernization of team pages: alignment, decade titles, and logos.

$baseDir = "c:\Projetos\Football Collection\public\paises"
$logosDir = "c:\Projetos\Football Collection\public\logos"

$folders = Get-ChildItem -Path $baseDir -Recurse -Directory

foreach ($folder in $folders) {
    # Find htm files in the folder (usually [foldername].htm)
    $htmFiles = Get-ChildItem -Path $folder.FullName -Filter "*.htm"
    
    foreach ($file in $htmFiles) {
        Write-Host "Processing $($file.FullName)..."
        $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
        
        # 1. Add align-left class to body
        if ($content -notmatch 'body class="[^"]*align-left') {
            $content = $content -replace '(<body\s+class=")([^"]*)(")', '$1$2 align-left$3'
            # Fallback if no class
            $content = $content -replace '<body>', '<body class="legacy-page align-left">'
        }
        
        # 2. Sanitize Decade Titles (Remove 's')
        $content = [regex]::Replace($content, '(<div class="decade-title">)(\d+)s(</div>)', '$1$2$3')
        
        # 3. Add Logo Section if missing
        if ($content -notmatch 'top-centered-logo') {
            # Try to determine team name for logo
            $teamName = $folder.Name
            $logoPath = ""
            
            # Check for possible logo files
            $extensions = @(".gif", ".jpg", ".png")
            foreach ($ext in $extensions) {
                if (Test-Path "$logosDir\$teamName$ext") {
                    $logoPath = "../../../logos/$teamName$ext"
                    break
                }
            }
            
            # Special logic for Seleção Brasileira (cbf)
            if ($teamName -eq "selecaob" -or $teamName -eq "brasil") {
                $logoPath = "../../../logos/cbf.gif"
            }
            
            if ($logoPath) {
                $logoHtml = @"
        <div class="top-centered-logo">
            <div class="item is-logo">
                <div class="image-wrapper">
                    <img src="$logoPath" alt="Logo" loading="lazy">
                </div>
            </div>
        </div>
"@
                # Insert after </header>
                if ($content -match '</header>') {
                    $content = $content -replace '</header>', "</header>`n$logoHtml"
                }
            }
        }
        
        # Save back
        $content | Set-Content -Path $file.FullName -Encoding utf8
    }
}

Write-Host "Modernization complete!"
