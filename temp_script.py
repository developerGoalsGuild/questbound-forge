from pathlib import Path

old = """function Get-SystemPython {
  $preferred = @($env:PYTHON_EXE, $env:PYTHON_PATH, $env:PYTHONHOME) | Where-Object { $_ }
  foreach ($cand in $preferred) {
    $exe = if ($cand -and $cand.ToLower().EndsWith('python.exe')) { $cand } elseif ($cand) { Join-Path $cand 'python.exe' } else { $null }
    if ($exe -and (Test-Path $exe)) { return (Resolve-Path $exe).Path }
  }

  $candidates = @('python', 'py')
  foreach ($cmd in $candidates) {
    try {
      $source = (Get-Command $cmd -ErrorAction Stop).Source
    } catch { continue }
    if (-not $source) { continue }
    if (-not (Test-Path $source)) { continue }
    if ($source -match '(?i)[\\/](?:WindowsApps|AppData\\Local\\Microsoft\\WindowsApps)[\\/]python(?:\\.exe)?$') { continue }
    if ($source -match '(?i)[\\/]Git[\\/](?:usr|mingw64)[\\/]bin[\\/](?:python|py)(?:\\.exe)?$') { continue }
    if ($source -match '(?i)[\\/](?:usr|mingw64)[\\/]bin[\\/](?:python|py)(?:\\.exe)?$') { continue }
    if ($source -notmatch '^[A-Za-z]:\\') { continue }
    return (Resolve-Path $source).Path
  }

  $searchRoots = @()
  if ($env:LOCALAPPDATA) { $searchRoots += Join-Path $env:LOCALAPPDATA 'Programs/Python' }
  if ($env:ProgramFiles) { $searchRoots += (Join-Path $env:ProgramFiles 'Python') }
  if ($env:ProgramFiles) { $searchRoots += (Join-Path $env:ProgramFiles 'Python311') }
  if ($env:ProgramFiles) { $searchRoots += (Join-Path $env:ProgramFiles 'Python312') }
  if ($env:ProgramFiles) { $searchRoots += (Join-Path $env:ProgramFiles 'Python313') }
  foreach ($root in $searchRoots) {
    if (-not (Test-Path $root)) { continue }
    $exe = Get-ChildItem -Path $root -Filter python.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($exe) { return $exe }
  }
  return $null
}
"""

new = """function Get-SystemPython {
  $preferred = @($env:PYTHON_EXE, $env:PYTHON_PATH, $env:PYTHONHOME) | Where-Object { $_ }
  foreach ($cand in $preferred) {
    $exe = if ($cand -and $cand.ToLower().EndsWith('python.exe')) { $cand } elseif ($cand) { Join-Path $cand 'python.exe' } else { $null }
    if ($exe -and (Test-Path $exe)) { return (Resolve-Path $exe).Path }
  }

  $pyLauncher = $null
  $commands = @('python', 'py')
  foreach ($cmd in $commands) {
    try {
      $source = (Get-Command $cmd -ErrorAction Stop).Source
    } catch { continue }
    if (-not $source) { continue }
    if (-not (Test-Path $source)) { continue }
    $resolved = (Resolve-Path $source).Path
    if ($resolved -match '(?i)[\\/](?:WindowsApps|AppData\\Local\\Microsoft\\WindowsApps)[\\/]python(?:\\.exe)?$') { continue }
    if ($resolved -match '(?i)[\\/]Git[\\/](?:usr|mingw64)[\\/]bin[\\/](?:python|py)(?:\\.exe)?$') { continue }
    if ($resolved -match '(?i)[\\/](?:usr|mingw64)[\\/]bin[\\/](?:python|py)(?:\\.exe)?$') { continue }
    if ($resolved -notmatch '^[A-Za-z]:\\') { continue }
    if ($resolved.ToLower().EndsWith('py.exe')) { $pyLauncher = $resolved; continue }
    return $resolved
  }

  $searchRoots = @()
  if ($env:LOCALAPPDATA) { $searchRoots += Join-Path $env:LOCALAPPDATA 'Programs/Python' }
  foreach ($pf in @($env:ProgramFiles, $env:"ProgramFiles(x86)")) {
    if ($pf) {
      $searchRoots += (Join-Path $pf 'Python')
      $searchRoots += (Join-Path $pf 'Python310')
      $searchRoots += (Join-Path $pf 'Python311')
      $searchRoots += (Join-Path $pf 'Python312')
      $searchRoots += (Join-Path $pf 'Python313')
    }
  }
  foreach ($root in $searchRoots) {
    if (-not (Test-Path $root)) { continue }
    $exe = Get-ChildItem -Path $root -Filter python.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($exe) { return $exe }
  }

  if ($pyLauncher) { return $pyLauncher }
  return $null
}
"""

path = Path('scripts/test-all.ps1')
text = path.read_text()
if old not in text:
    raise SystemExit('expected block not found')
path.write_text(text.replace(old, new))
