$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"
$outputPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\jsx_result.txt"

$log = @()
function Log-Msg($msg) {
    $global:log += $msg
}

try {
    $html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
    $startTag = '<script type="text/babel">'
    $start = $html.IndexOf($startTag)
    if ($start -eq -1) {
        Log-Msg "Babel start tag not found"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    $start += $startTag.Length
    $end = $html.IndexOf('</script>', $start)
    $code = $html.Substring($start, $end - $start)

    Log-Msg "Extracted code length: $($code.Length) characters."

    # Parse brackets and braces using a simple state machine
    $lines = $code -split "`r`n"
    if ($lines.Length -eq 1) {
        $lines = $code -split "`n"
    }

    $stack = @()
    $inString = $null
    $inComment = $null

    for ($i = 0; $i -lt $lines.Length; $i++) {
        $lineNum = $i + 1
        $line = $lines[$i]
        $chars = $line.ToCharArray()

        for ($j = 0; $j -lt $chars.Length; $j++) {
            $c = $chars[$j]

            if ($inComment -eq 'line') {
                break
            }
            if ($inComment -eq 'block') {
                if ($c -eq '*' -and $j + 1 -lt $chars.Length -and $chars[$j+1] -eq '/') {
                    $inComment = $null
                    $j++
                }
                continue
            }
            if ($inString) {
                if ($c -eq $inString) {
                    $escaped = $false
                    $k = $j - 1
                    while ($k -ge 0 -and $chars[$k] -eq '\') {
                        $escaped = -not $escaped
                        $k--
                    }
                    if (-not $escaped) {
                        $inString = $null
                    }
                }
                continue
            }

            if ($c -eq '/' -and $j + 1 -lt $chars.Length -and $chars[$j+1] -eq '/') {
                $inComment = 'line'
                $j++
                break
            }
            if ($c -eq '/' -and $j + 1 -lt $chars.Length -and $chars[$j+1] -eq '*') {
                $inComment = 'block'
                $j++
                continue
            }
            if ($c -eq "'" -or $c -eq '"' -or $c -eq '`') {
                $inString = $c
                continue
            }

            # Brackets tracking
            if ($c -eq '{' -or $c -eq '(' -or $c -eq '[') {
                $stack += ,@{ char = $c; line = $lineNum; col = $j + 1 }
            }
            elseif ($c -eq '}') {
                if ($stack.Count -eq 0) {
                    Log-Msg "Unmatched } at line $lineNum, col $($j+1)"
                } else {
                    $last = $stack[-1]
                    if ($last.char -eq '{') {
                        if ($stack.Count -eq 1) { $stack = @() }
                        else { $stack = $stack[0..($stack.Count-2)] }
                    } else {
                        Log-Msg "Mismatched } at line $lineNum, col $($j+1). Expected closing for $($last.char) from line $($last.line), col $($last.col)"
                    }
                }
            }
            elseif ($c -eq ')') {
                if ($stack.Count -eq 0) {
                    Log-Msg "Unmatched ) at line $lineNum, col $($j+1)"
                } else {
                    $last = $stack[-1]
                    if ($last.char -eq '(') {
                        if ($stack.Count -eq 1) { $stack = @() }
                        else { $stack = $stack[0..($stack.Count-2)] }
                    } else {
                        Log-Msg "Mismatched ) at line $lineNum, col $($j+1). Expected closing for $($last.char) from line $($last.line), col $($last.col)"
                    }
                }
            }
            elseif ($c -eq ']') {
                if ($stack.Count -eq 0) {
                    Log-Msg "Unmatched ] at line $lineNum, col $($j+1)"
                } else {
                    $last = $stack[-1]
                    if ($last.char -eq '[') {
                        if ($stack.Count -eq 1) { $stack = @() }
                        else { $stack = $stack[0..($stack.Count-2)] }
                    } else {
                        Log-Msg "Mismatched ] at line $lineNum, col $($j+1). Expected closing for $($last.char) from line $($last.line), col $($last.col)"
                    }
                }
            }
        }
        if ($inComment -eq 'line') {
            $inComment = $null
        }
    }

    if ($stack.Count -gt 0) {
        Log-Msg "Still open brackets at end of file:"
        foreach ($item in $stack) {
            Log-Msg "  $($item.char) at line $($item.line), col $($item.col)"
        }
    } else {
        Log-Msg "All brackets/braces balance checked: OK."
    }

} catch {
    Log-Msg "Execution Error: $_"
}

$log | Out-File -FilePath $outputPath -Encoding UTF8
Write-Output "Done checking. Result written to jsx_result.txt"
