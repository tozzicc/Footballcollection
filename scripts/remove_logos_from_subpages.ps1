
# remove_logos_from_subpages.ps1
# Removes the logo section from individual year pages, keeping it only on the main team index pages.

$baseDir = "c:\Projetos\Football Collection\public\paises"

$folders = Get-ChildItem -Path $baseDir -Recurse -Directory

foreach ($folder in $folders) {
    $htmFiles = Get-ChildItem -Path $folder.FullName -Filter "*.htm"
    
    foreach ($file in $htmFiles) {
        $parentName = $folder.Name
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        
        # If the file is NOT the main team page (name mismatch)
        if ($fileName -ne $parentName) {
            Write-Host "Removing logo from subpage: $($file.FullName)"
            $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
            
            # Remove the top-centered-logo block
            # This regex matches the block I inserted earlier
            $pattern = '(?s)\s*<div class="top-centered-logo">.*?</div>\s*</div>\s*</div>'
            if ($content -match $pattern) {
                $content = $content -replace $pattern, ""
                $content | Set-Content -Path $file.FullName -Encoding utf8
            }
        }
    }
}

Write-Host "Cleanup complete!"
