# convert_legacy_to_grid.ps1

$baseDir = "c:\Projetos\Football Collection\public\paises"
$files = Get-ChildItem -Path $baseDir -Recurse -Include *.htm, *.html

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    
    if ($content -match '<table[^>]*>') {
        Write-Host "Converting: $($file.FullName)"
        
        $title = ""
        if ($content -match '<title>(.*?)</title>') { $title = $matches[1] }
        
        $allNewGroups = ""
        $imgTables = [regex]::Matches($content, '(?s)<table[^>]*>.*?<img.*?</table>')
        
        foreach ($it in $imgTables) {
            $tableHtml = $it.Value
            $imgs = [regex]::Matches($tableHtml, 'src="([^"]*)"')
            $imgList = ""
            foreach ($img in $imgs) {
                $src = $img.Groups[1].Value
                $imgList += "          <div class='item'><div class='image-wrapper'><img src='$src' loading='lazy'></div></div>`n"
            }
            
            $remaining = $content.Substring($it.Index + $it.Length)
            $caption = ""
            if ($remaining -match '(?s)^\s*(?:<hr>)?\s*<table[^>]*>.*?<div[^>]*>(.*?)</div>.*?</table>') {
                $captionHtml = $matches[1]
                $caption = [regex]::Replace($captionHtml, '<[^>]*>', "").Trim()
                $caption = $caption -replace '&Atilde;', "Ã" -replace '&Eacute;', "É" -replace '&Iacute;', "Í" -replace '&Oacute;', "Ó" -replace '&Uacute;', "Ú" -replace '&ccedil;', "ç" -replace '&Ccedil;', "Ç"
            }
            
            if ($imgList) {
                $allNewGroups += "    <div class='shirt-group'><div class='group-items'>`n$imgList</div><div class='group-caption'>$caption</div></div>`n"
            }
        }
        
        if ($allNewGroups) {
            $footerMatch = [regex]::Match($content, '(?s)<footer>.*?</footer>')
            $scriptMatch = [regex]::Match($content, '(?s)<script>.*?</script>')
            
            $finalContent = "<!DOCTYPE html><html lang='pt'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>$title</title><link rel='stylesheet' href='/modern-legacy.css'></head><body class='legacy-page align-left'>"
            $finalContent += "<header><h1>$title</h1></header><main>$allNewGroups</main>"
            $finalContent += $footerMatch.Value
            $finalContent += $scriptMatch.Value
            $finalContent += "</body></html>"
            
            $finalContent | Set-Content -Path $file.FullName -Encoding utf8
        }
    }
}

Write-Host "Conversion complete!"
