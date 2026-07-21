param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving '$Root' at $prefix (Ctrl+C to stop)"

$mimeMap = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".svg"  = "image/svg+xml"
  ".xml"  = "application/xml"
  ".txt"  = "text/plain; charset=utf-8"
  ".ico"  = "image/x-icon"
  ".mp4"  = "video/mp4"
  ".json" = "application/json; charset=utf-8"
}

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
  } catch {
    continue
  }

  # Everything below runs in its own guard so one bad request (aborted
  # connection, video range request, etc.) can never kill the whole server.
  try {
    $request = $context.Request
    $response = $context.Response
    try {
      $relPath = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relPath)) { $relPath = "index.html" }
      $filePath = Join-Path $Root $relPath

      if (Test-Path -LiteralPath $filePath -PathType Container) {
        $filePath = Join-Path $filePath "index.html"
      }

      if (Test-Path -LiteralPath $filePath -PathType Leaf) {
        $ext = [IO.Path]::GetExtension($filePath).ToLower()
        $contentType = $mimeMap[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $notFound = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
        $response.StatusCode = 404
        $response.ContentLength64 = $notFound.Length
        $response.OutputStream.Write($notFound, 0, $notFound.Length)
      }
    } catch {
      try {
        $errBytes = [Text.Encoding]::UTF8.GetBytes("500 Server Error")
        $response.StatusCode = 500
        $response.ContentLength64 = $errBytes.Length
        $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
      } catch {
        # Client likely disconnected mid-response (e.g. video seek/abort). Ignore.
      }
    } finally {
      try { $response.OutputStream.Close() } catch {}
    }
  } catch {
    # Never let a single request take down the listener loop.
  }
}
