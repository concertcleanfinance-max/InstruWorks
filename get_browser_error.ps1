$htmlPath = "C:\Users\matth\.gemini\antigravity\scratch\brass-woodwind-repair-app\index.html"

Write-Host "Launching headless Edge..."
$process = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList "--headless", "--disable-gpu", "--remote-debugging-port=9222", "--allow-file-access-from-files", "--no-sandbox", "file:///$htmlPath" -PassThru -NoNewWindow

# Wait for page to load and react compilation to fail (4 seconds)
Write-Host "Waiting 6 seconds for page to compile..."
Start-Sleep -Seconds 6

try {
    # Query Edge debug targets
    Write-Host "Querying debug target..."
    $targets = Invoke-RestMethod -Uri "http://localhost:9222/json"
    $target = $targets | Where-Object { $_.url -like "*index.html*" } | Select-Object -First 1
    
    if ($target) {
        $webSocketDebuggerUrl = $target.webSocketDebuggerUrl
        Write-Host "Debug URL found: $webSocketDebuggerUrl"
        
        # We want to run a script on the page to get the #error-message text.
        # Since we don't have a WebSocket client easily available in pure PowerShell without external assemblies,
        # we can use the DevTools HTTP endpoint to evaluate JS if supported, OR we can read the page DOM.
        # Wait, the JSON API has a limited set of commands, but we can query it!
        # Actually, let's see if we can use a simpler way:
        # Edge stores its user data and logs, but we can also just use the WebSocket class from .NET!
        # [System.Net.WebSockets.ClientWebSocket] is built into .NET 4.5+!
        
        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $cts = New-Object System.Threading.CancellationTokenSource
        
        $uri = New-Object System.Uri($webSocketDebuggerUrl)
        $connTask = $ws.ConnectAsync($uri, $cts.Token)
        $connTask.Wait()
        
        # Send evaluate command: Runtime.evaluate
        $payload = @{
            id = 1
            method = "Runtime.evaluate"
            params = @{
                expression = '("ROOT_HTML: " + (document.getElementById("root") ? document.getElementById("root").innerHTML.substring(0, 200) : "no-root") + "\nERRORS: " + (window.__logs || []).join("\n") + "\nFALLBACK: " + (document.getElementById("error-message") ? document.getElementById("error-message").innerText : "none"))'
                returnByValue = $true
            }
        } | ConvertTo-Json -Compress
        
        Write-Host "Sending evaluate command..."
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $segment = New-Object System.ArraySegment[Byte]($bytes, 0, $bytes.Length)
        $sendTask = $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token)
        $sendTask.Wait()
        
        # Receive response
        $buffer = New-Object Byte[] 4096
        $segment = New-Object System.ArraySegment[Byte]($buffer, 0, $buffer.Length)
        $receiveTask = $ws.ReceiveAsync($segment, $cts.Token)
        $receiveTask.Wait()
        
        $responseJson = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $receiveTask.Result.Count)
        $response = ConvertTo-Json (ConvertFrom-Json $responseJson)
        Write-Host "Response received:"
        Write-Host $response
        
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
    } else {
        Write-Host "Target page not found in debug list. Page list:"
        $targets | ConvertTo-Json | Write-Host
    }
} catch {
    Write-Host "Error querying debugging interface: $_"
}

# Clean up process
Write-Host "Stopping Edge..."
Stop-Process -Id $process.Id -Force
