$txt = [System.IO.File]::ReadAllText("products.js", [System.Text.Encoding]::UTF8)
Write-Host ("Length: " + $txt.Length)
Write-Host ("Start: " + $txt.Substring(0, 100))
Write-Host ("End: " + $txt.Substring($txt.Length - 100))
