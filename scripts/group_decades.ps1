param (
    [string]$FilePath
)

$content = Get-Content -Path $FilePath -Raw

# 1. Identify the range of decade-sections
# We look for all decade-section blocks. We need to find the FIRST one's start and the LAST one's end.
$sectionRegex = '(?s)<div class="decade-section">.*?</div>\s*</div>'
$allSectionMatches = [regex]::Matches($content, $sectionRegex)
if ($allSectionMatches.Count -eq 0) {
    Write-Host "No decade sections found in $FilePath"
    exit
}

$startIndex = $allSectionMatches[0].Index
$endIndex = $allSectionMatches[$allSectionMatches.Count - 1].Index + $allSectionMatches[$allSectionMatches.Count - 1].Length

# 2. Extract ALL unique links from these sections
$groups = @{}
$specialLinks = @()
$seenHrefs = @{}

foreach ($m in $allSectionMatches) {
    # Use a robust link matches regex
    $linkMatch = [regex]::Matches($m.Value, '(?s)<a\s+(?:[^>]*?\s+)?href="(?<href>[^"]*)"[^>]*>(?<text>.*?)</a>')
    foreach ($lm in $linkMatch) {
        $href = $lm.Groups["href"].Value
        $text = $lm.Groups["text"].Value -replace '<[^>]*>', '' -replace '&nbsp;', ' ' -replace '\s+', ' '
        $text = $text.Trim()
        $link = $lm.Value
        
        # Avoid duplicate links by href
        if ($seenHrefs.ContainsKey($href)) { continue }
        $seenHrefs[$href] = $true

        $year = $null
        # Decade Logic
        if ($text -match '^(\d{2})[-/]\d{2}$') {
            $yy = [int]$Matches[1]
            if ($yy -gt 25) { $year = 1900 + $yy } else { $year = 2000 + $yy }
        }
        elseif ($text -match '^(\d{2})-(\d{2})$') {
            $yy = [int]$Matches[1]
            if ($yy -gt 25) { $year = 1900 + $yy } else { $year = 2000 + $yy }
        }
        elseif ($text -match '^(\d{4})$') {
            $year = [int]$Matches[1]
        }
        elseif ($text -match '^(\d{2})$') {
            $yy = [int]$Matches[1]
            if ($yy -gt 25) { $year = 1900 + $yy } else { $year = 2000 + $yy }
        }
        elseif ($text -match '^00-01$') {
            $year = 2000
        }

        if ($year -ne $null) {
            # Force decade to be an Integer
            $decade = [int]([math]::Floor($year / 10) * 10)
            if (-not $groups.ContainsKey($decade)) { $groups[$decade] = @() }
            
            # Standardize button class
            $cleanLink = $link -replace 'class="[^"]*"', 'class="nav-button"'
            if ($cleanLink -notmatch 'class=') { $cleanLink = $cleanLink -replace '<a ', '<a class="nav-button" ' }
            
            $groups[$decade] += [PSCustomObject]@{ Year = $year; Link = $cleanLink }
        } else {
            # Special links handling
            $lowerText = $text.ToLower()
            if ($lowerText -notmatch 'voltar' -and $lowerText -notmatch 'item' -and $lowerText -ne "") {
                $cleanLink = $link -replace 'class="[^"]*"', 'class="nav-button"'
                if ($cleanLink -notmatch 'class=') { $cleanLink = $cleanLink -replace '<a ', '<a class="nav-button" ' }
                $specialLinks += $cleanLink
            }
        }
    }
}

# 3. Build new sections string
$newSections = ""
$sortedDecades = $groups.Keys | Sort-Object
foreach ($dec in $sortedDecades) {
    # Sort within decade by Year
    $sortedLinks = $groups[$dec] | Sort-Object Year | ForEach-Object { $_.Link }
    
    $newSections += "`n    <div class=`"decade-section`">`n"
    $newSections += "        <div class=`"decade-title`">$dec</div>`n"
    $newSections += "        <div class=`"link-grid`">`n            "
    $newSections += ($sortedLinks -join "")
    $newSections += "`n        </div>`n"
    $newSections += "    </div>"
}

if ($specialLinks.Count -gt 0) {
    # Unique special links
    $uniqueSpecial = $specialLinks | Where-Object { $_ -notmatch 'history.back' } | Select-Object -Unique
    
    $newSections += "`n    <div class=`"decade-section`">`n"
    $newSections += "        <div class=`"decade-title`">Outros / Others</div>`n"
    $newSections += "        <div class=`"link-grid`">`n            "
    $newSections += ($uniqueSpecial -join "")
    $newSections += "`n        </div>`n"
    $newSections += "    </div>"
}

# 4. Reconstruct the content
$before = $content.Substring(0, $startIndex)
$after = $content.Substring($endIndex)
$finalContent = $before.TrimEnd() + "`n" + $newSections + "`n" + $after.TrimStart()

$finalContent | Set-Content -Path $FilePath -NoNewline
Write-Host "Successfully restructured $FilePath"
