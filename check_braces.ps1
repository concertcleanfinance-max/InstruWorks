$outputPath = "output.txt"
$log = @()

function Log-Message($msg) {
    $global:log += $msg
    Write-Output $msg
}

try {
    if (-not (Test-Path "index.html")) {
        Log-Message "ERROR: index.html not found in current directory"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    
    $html = [System.IO.File]::ReadAllText("index.html")
    $startTag = '<script type="text/babel">'
    $start = $html.IndexOf($startTag)
    if ($start -eq -1) {
        Log-Message "ERROR: Could not find start tag"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    $start += $startTag.Length
    $end = $html.IndexOf('</script>', $start)
    if ($end -eq -1) {
        Log-Message "ERROR: Could not find end tag"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    $code = $html.Substring($start, $end - $start)
    Log-Message "Extracted script length: $($code.Length) characters."

    $chars = $code.ToCharArray()
    $ob = 0; $cb = 0; $op = 0; $cp = 0; $ok = 0; $ck = 0
    foreach ($c in $chars) {
        if ($c -eq '{') { $ob++ }
        elseif ($c -eq '}') { $cb++ }
        elseif ($c -eq '(') { $op++ }
        elseif ($c -eq ')') { $cp++ }
        elseif ($c -eq '[') { $ok++ }
        elseif ($c -eq ']') { $ck++ }
    }
    Log-Message "Braces: { = $ob, } = $cb (Diff: $($ob - $cb))"
    Log-Message "Parens: ( = $op, ) = $cp (Diff: $($op - $cp))"
    Log-Message "Brackets: [ = $ok, ] = $ck (Diff: $($ok - $ck))"
} catch {
    Log-Message "ERROR: $_"
}

$log | Out-File -FilePath $outputPath -Encoding UTF8
