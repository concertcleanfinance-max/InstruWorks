$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Extract Babel script content
$startTag = '<script type="text/babel">'
$start = $html.IndexOf($startTag)
if ($start -eq -1) {
    Write-Host "Babel start tag not found"
    exit 1
}
$start += $startTag.Length
$end = $html.IndexOf('</script>', $start)
$code = $html.Substring($start, $end - $start)

# We want to find the tag mismatches
# Let's do a character-by-character scan of the code
# to identify JSX tags, ignoring strings and comments.

$i = 0
$len = $code.Length
$lineNum = 1411 # script start line in index.html is ~1410
$colNum = 1

function Next-Char {
    if ($i -ge $len) { return $null }
    $c = $code[$i]
    $script:i++
    if ($c -eq "`n") {
        $script:lineNum++
        $script:colNum = 1
    } else {
        $script:colNum++
    }
    return $c
}

function Peek-Char {
    if ($i -ge $len) { return $null }
    return $code[$i]
}

$stack = @() # Stack of @{ tag = name; line = lineNum; col = colNum }

while ($i -lt $len) {
    $c = Next-Char
    
    # Ignore comments and strings
    if ($c -eq '/' -and (Peek-Char) -eq '/') {
        # Line comment
        while ($i -lt $len -and (Peek-Char) -ne "`n") {
            [void](Next-Char)
        }
        continue
    }
    if ($c -eq '/' -and (Peek-Char) -eq '*') {
        # Block comment
        [void](Next-Char) # consume *
        while ($i -lt $len) {
            $nc = Next-Char
            if ($nc -eq '*' -and (Peek-Char) -eq '/') {
                [void](Next-Char)
                break
            }
        }
        continue
    }
    if ($c -eq '"' -or $c -eq "'" -or $c -eq '`') {
        # String literal
        $quote = $c
        while ($i -lt $len) {
            $nc = Next-Char
            if ($nc -eq '\') {
                [void](Next-Char) # skip escaped char
            } elseif ($nc -eq $quote) {
                break
            }
        }
        continue
    }
    
    # Check for tag start
    # In JSX, a tag starts with '<' followed by a letter (or tag start symbol like '/')
    # but not <= or <- or spaces
    if ($c -eq '<') {
        $peek = Peek-Char
        if ($peek -match '[a-zA-Z/]') {
            # We found a potential tag!
            # Let's read the tag content until we find '>'
            # But wait! Inside a tag, there could be strings (like className="...") 
            # and expressions (like style={{...}}). We must handle them so we don't 
            # get confused by '>' inside strings or expressions!
            
            $tagStartLine = $lineNum
            $tagStartCol = $colNum - 1
            $tagContent = ""
            $inTagString = $null
            $braceDepth = 0
            
            while ($i -lt $len) {
                $tc = Next-Char
                
                # Handle quotes inside tag
                if ($inTagString) {
                    if ($tc -eq '\') {
                        [void](Next-Char)
                    } elseif ($tc -eq $inTagString) {
                        $inTagString = $null
                    }
                    $tagContent += $tc
                    continue
                }
                if ($tc -eq '"' -or $tc -eq "'") {
                    $inTagString = $tc
                    $tagContent += $tc
                    continue
                }
                
                # Handle braces inside tag (like style={{...}})
                if ($tc -eq '{') {
                    $braceDepth++
                } elseif ($tc -eq '}') {
                    $braceDepth--
                }
                
                # If braceDepth > 0, we are inside an expression, ignore '>'
                if ($braceDepth -le 0 -and $tc -eq '>') {
                    break
                }
                
                $tagContent += $tc
            }
            
            # Now we have the tagContent (everything between '<' and '>')
            # Let's analyze it!
            $tagContent = $tagContent.Trim()
            
            if ($tagContent.StartsWith('/')) {
                # Closing tag, e.g. </div
                $tagName = $tagContent.Substring(1).Trim().Split("`t `r`n")[0]
                if ($tagName -eq "") {
                    continue
                }
                if ($stack.Count -eq 0) {
                    Write-Host ("Unmatched closing tag </" + $tagName + "> at line " + $tagStartLine + ", col " + $tagStartCol)
                } else {
                    $last = $stack[-1]
                    if ($last.tag -eq $tagName) {
                        # Match! Pop from stack
                        if ($stack.Count -eq 1) { $stack = @() }
                        else { $stack = $stack[0..($stack.Count-2)] }
                    } else {
                        # Mismatched tag!
                        Write-Host ("Mismatched tag: </" + $tagName + "> at line " + $tagStartLine + " does not match <" + $last.tag + "> from line " + $last.line + ", col " + $last.col)
                    }
                }
            } elseif ($tagContent.EndsWith('/')) {
                # Self-closing tag, e.g. <input ... /
                # Do nothing, it is closed
            } else {
                # Opening tag, e.g. <div className="..."
                $tagName = $tagContent.Split("`t `r`n")[0]
                
                # Check if it is a standard self-closing void tag in HTML that was NOT self-closed in JSX
                $voidTags = @('input', 'img', 'br', 'hr', 'link', 'meta')
                if ($voidTags -contains $tagName.ToLower()) {
                    # In JSX, all void tags must be self-closed with '/>'
                    # If this tag didn't end with '/', it's a JSX compile error!
                    Write-Host ("JSX Error: void tag <" + $tagName + "> at line " + $tagStartLine + ", col " + $tagStartCol + " is not self-closed with '/>'")
                } else {
                    # Push opening tag to stack
                    # But exclude fragment tags '<>'
                    if ($tagName -ne "") {
                        $stack += ,@{ tag = $tagName; line = $tagStartLine; col = $tagStartCol }
                    }
                }
            }
        }
    }
}

if ($stack.Count -gt 0) {
    Write-Host "Still open JSX tags at end of file:"
    foreach ($item in $stack) {
        Write-Host ("  <" + $item.tag + "> opened at line " + $item.line + ", col " + $item.col)
    }
} else {
    Write-Host "All JSX tags balanced successfully!"
}
