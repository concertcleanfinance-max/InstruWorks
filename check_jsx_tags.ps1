$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Extract babel script content
$startTag = '<script type="text/babel">'
$start = $html.IndexOf($startTag)
if ($start -eq -1) {
    Write-Host "Babel start tag not found"
    exit 1
}
$start += $startTag.Length
$end = $html.IndexOf('</script>', $start)
$code = $html.Substring($start, $end - $start)

# Split into lines
$lines = $code -split "`r`n"
if ($lines.Length -eq 1) {
    $lines = $code -split "`n"
}

# Scan for unclosed void tags in JSX
# Void tags are input, img, br, hr, link, meta
$voidTags = @('input', 'img', 'br', 'hr', 'link', 'meta')

for ($i = 0; $i -lt $lines.Length; $i++) {
    $lineNum = $i + 1411 # offset of the script tag in index.html is ~1410
    $line = $lines[$i]
    
    # We only care about lines with tags
    if ($line -match "<([a-zA-Z0-9]+)\b") {
        foreach ($tag in $voidTags) {
            # Match <tag... but not ending with />
            # Regex: <tag followed by anything that doesn't have > or / until it finds > (without / before it)
            # Or simpler: if it contains "<tag" but doesn't have "/>" on the same tag block
            # Let's find matches of "<tag" on this line
            $indices = @()
            $idx = $line.IndexOf("<$tag")
            while ($idx -ne -1) {
                $indices += $idx
                $idx = $line.IndexOf("<$tag", $idx + 1)
            }
            
            foreach ($startIdx in $indices) {
                # Find the closing '>' for this tag
                $endIdx = $line.IndexOf('>', $startIdx)
                if ($endIdx -ne -1) {
                    $tagContent = $line.Substring($startIdx, $endIdx - $startIdx + 1)
                    # Check if the tag content ends with "/>" or is closed
                    if (-not ($tagContent -like "*/>")) {
                        Write-Host ("Suspicious void tag at line " + $lineNum + ": " + $tagContent)
                    }
                } else {
                    # Closing '>' might be on a subsequent line, print line for manual inspection
                    Write-Host ("Multi-line tag starting at line " + $lineNum + ": " + $line.Trim())
                }
            }
        }
    }
}
Write-Host "Void tags check completed."
