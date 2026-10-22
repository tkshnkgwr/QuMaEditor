<#
.SYNOPSIS
    QuMaEditor Rust 単体テスト実行スクリプト (Windows / ComCtl32 v6 マニフェスト自動解決)
.DESCRIPTION
    Tauri v2 + Windows 環境において、テストバイナリに Common Controls v6 マニフェストが
    欠落することで発生する 0xc0000139 (STATUS_ENTRYPOINT_NOT_FOUND) を自動回避し、
    全単体テストを確実に実行・検証します。
#>

if ($PSScriptRoot) {
    $root = Split-Path -Parent $PSScriptRoot
} else {
    $root = (Get-Location).Path
}
$tauriDir = Join-Path $root "src-tauri"
$manifestPath = Join-Path $tauriDir "common_controls_v6.manifest"

Write-Host "==> 1. テストバイナリのビルド (cargo test --no-run)..." -ForegroundColor Cyan
& cargo test --manifest-path (Join-Path $tauriDir "Cargo.toml") --no-run
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# Windows MSVC 環境の mt.exe 探索
$mtFile = Get-ChildItem -Path "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\mt.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
$mtPath = if ($mtFile) { $mtFile.FullName } else { $null }

$testBinaries = Get-ChildItem -Path (Join-Path $tauriDir "target\debug\deps\quma_editor_lib-*.exe") -ErrorAction SilentlyContinue

if ($mtPath -and (Test-Path $manifestPath)) {
    foreach ($bin in $testBinaries) {
        Write-Host "==> 2. ComCtl32 v6 マニフェスト埋め込み: $($bin.Name)..." -ForegroundColor Cyan
        & $mtPath -manifest $manifestPath "-outputresource:$($bin.FullName);#1" | Out-Null
    }
}

Write-Host "==> 3. テスト実行..." -ForegroundColor Cyan
$failed = $false
foreach ($bin in $testBinaries) {
    Write-Host "Running: $($bin.Name)" -ForegroundColor Green
    & $bin.FullName $args
    if ($LASTEXITCODE -ne 0) {
        $failed = $true
    }
}

if ($failed) {
    exit 1
}
Write-Host "==> すべての Rust テストが成功しました。" -ForegroundColor Green
