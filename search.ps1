$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"
$content = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$lines = $content -split "`r`n"
if ($lines.Length -eq 1) {
    $lines = $content -split "`n"
}

$output = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -like "*localStorage*") {
        $output += "$($i + 1): $($line.Trim())"
    }
}

$output | Out-File "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\localstorage_matches.txt" -Encoding UTF8
Write-Host "Done! Found $($output.Count) matches."
