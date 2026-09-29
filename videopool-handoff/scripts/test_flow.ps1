Param(
    [string]$Url = 'https://www.youtube.com/watch?v=mcg4z1gGbEw',
    [switch]$Denoise,
    [switch]$OpticalFlow
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$resources = Resolve-Path (Join-Path $root '..\resources')
$ytdlp = Join-Path $resources 'yt-dlp.exe'
$ffmpeg = Join-Path $resources 'ffmpeg.exe'

if (-not (Test-Path $ytdlp)) { Write-Error 'yt-dlp.exe missing in resources. Run scripts\prepare-resources.ps1 first.'; exit 1 }
if (-not (Test-Path $ffmpeg)) { Write-Error 'ffmpeg.exe missing in resources. Run scripts\prepare-resources.ps1 first.'; exit 1 }

$outDir = Join-Path $root 'test-output'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

Write-Output "Downloading $Url to $outDir using $ytdlp"
& $ytdlp -f best -o (Join-Path $outDir "%(title)s [%(id)s].%(ext)s") $Url --no-playlist --no-progress
if ($LASTEXITCODE -ne 0) { Write-Error "yt-dlp failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

# Find downloaded file
$video = Get-ChildItem -Path $outDir -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $video) { Write-Error 'No downloaded file found'; exit 1 }

# Build ffmpeg args to upscale to 4k, 60fps, h264 mov, optional denoise and optical flow
$in = $video.FullName
$scale = '3840:2160'
$fps = 60
$vfParts = @()
if ($Denoise) { $vfParts += "hqdn3d=1.5:1.5:6:6" }
# Use explicit literal values to avoid interpolation issues when passed to ffmpeg
$vfParts += "scale=3840:2160:flags=lanczos"
if ($OpticalFlow) {
    # Use minterpolate for optical flow frame interpolation with explicit fps
    $vfParts += "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
}
$vf = $vfParts -join ','

$out = [System.IO.Path]::ChangeExtension($in, '.mov')
$bitrate = '20000k'

$ffArgs = @('-y', '-i', $in)
if ($vf) { $ffArgs += '-vf'; $ffArgs += $vf }
$ffArgs += @('-c:v','libx264','-b:v',$bitrate,'-preset','slow','-r',"$fps",'-movflags','faststart',$out)

Write-Output "Encoding to $out with args: $($ffArgs -join ' ')"
& $ffmpeg $ffArgs
if ($LASTEXITCODE -ne 0) { Write-Error "ffmpeg failed with exit code $LASTEXITCODE"; exit $LASTEXITCODE }

Write-Output "Test flow complete. Output: $out"