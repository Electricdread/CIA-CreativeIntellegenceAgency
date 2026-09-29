# Downloads bundled binaries into resources
param()
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$resources = Join-Path $root '..\resources' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $resources) { $resources = Join-Path $root '..\resources' ; New-Item -ItemType Directory -Force -Path $resources | Out-Null }
$resources = (Resolve-Path $resources).Path

Write-Output "Resources path: $resources"

# Download yt-dlp.exe
$ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
$ytdlpDest = Join-Path $resources 'yt-dlp.exe'
if (-not (Test-Path $ytdlpDest)) {
    Write-Output 'Downloading yt-dlp.exe...'
    Invoke-WebRequest -Uri $ytdlpUrl -OutFile $ytdlpDest -UseBasicParsing
    Write-Output 'yt-dlp downloaded.'
} else { Write-Output 'yt-dlp already present.' }

# Download ffmpeg essentials build (zip) and extract ffmpeg.exe
$ffZipUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
$tempZip = Join-Path $env:TEMP 'ffmpeg-essentials.zip'
if (-not (Test-Path (Join-Path $resources 'ffmpeg.exe'))) {
    Write-Output 'Downloading ffmpeg zip (this may take a while)...'
    Invoke-WebRequest -Uri $ffZipUrl -OutFile $tempZip -UseBasicParsing
    Write-Output 'Extracting ffmpeg...'
    $extractDir = Join-Path $env:TEMP 'ffmpeg-extract'
    if (Test-Path $extractDir) { Remove-Item -LiteralPath $extractDir -Recurse -Force }
    Expand-Archive -Path $tempZip -DestinationPath $extractDir
    # Find ffmpeg.exe in the extracted tree
    $ff = Get-ChildItem -Path $extractDir -Recurse -Filter 'ffmpeg.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ff) { Copy-Item -Path $ff.FullName -Destination (Join-Path $resources 'ffmpeg.exe') -Force ; Write-Output 'ffmpeg copied to resources.' } else { Write-Output 'ffmpeg.exe not found in archive.' }
    Remove-Item -LiteralPath $tempZip -Force
    if (Test-Path $extractDir) { Remove-Item -LiteralPath $extractDir -Recurse -Force }
} else { Write-Output 'ffmpeg already present.' }

Write-Output 'prepare-resources complete.'