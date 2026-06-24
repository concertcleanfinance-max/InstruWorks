foreach ($file in @("libs/react.production.min.js", "libs/react-dom.production.min.js", "libs/babel.min.js")) {
    if (Test-Path $file) {
        $txt = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        Write-Host ($file + " length: " + $txt.Length)
        Write-Host ($file + " start: " + $txt.Substring(0, [Math]::Min(100, $txt.Length)))
    } else {
        Write-Host ($file + " does not exist!")
    }
}
