$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"
$outputPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\syntax_result.txt"
$log = @()

function Log-Msg($msg) {
    $global:log += $msg
}

try {
    $html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
    $startTag = '<script type="text/babel">'
    $start = $html.IndexOf($startTag)
    if ($start -eq -1) {
        Log-Msg "Start tag not found"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    $start += $startTag.Length
    $end = $html.IndexOf('</script>', $start)
    if ($end -eq -1) {
        Log-Msg "End tag not found"
        $log | Out-File -FilePath $outputPath -Encoding UTF8
        exit 1
    }
    $code = $html.Substring($start, $end - $start)

    # Now, parse $code character by character
    $stack = @()
    $lines = $code -split "`r`n"
    if ($lines.Length -eq 1) {
        $lines = $code -split "`n"
    }

    $lineNum = 0
    $inString = $null
    $inComment = $null

    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        $lineNum = $i + 1
        $chars = $line.ToCharArray()
        
        for ($j = 0; $j -lt $chars.Length; $j++) {
            $c = $chars[$j]
            
            # Simple comment/string state machine
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
                    # Check for escaped quote
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
            
            # Check for start of comments or strings
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
            
            # Track brackets
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
        Log-Msg "All brackets match successfully!"
    }
} catch {
    Log-Msg "Error: $_"
}

$log | Out-File -FilePath $outputPath -Encoding UTF8
