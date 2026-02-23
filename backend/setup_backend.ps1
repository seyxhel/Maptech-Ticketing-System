<#
Setup script for the Django backend.

This script will:
 - create/activate a virtualenv at `venv`
 - upgrade pip and install `requirements.txt`
 - run `makemigrations` and `migrate`
 - run `python manage.py seed_users` (if available)
 - start the development server with `runserver` (unless `-NoRunServer` is passed)
#>

param(
    [switch]$NoRunServer,
    [string]$VenvPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "[1/6] Determine virtualenv location..."

# If user provided a VenvPath, use it. Otherwise prefer ./venv then ../venv, else create ./venv
if ($PSBoundParameters.ContainsKey('VenvPath') -and $VenvPath) {
    $venv = $VenvPath
    Write-Host "Using provided venv: $venv"
} else {
    if (Test-Path -Path ".\venv") {
        $venv = ".\venv"
        Write-Host "Found venv at .\venv"
    } elseif (Test-Path -Path "..\venv") {
        $venv = "..\venv"
        Write-Host "Found venv at ..\venv"
    } else {
        $venv = ".\venv"
        Write-Host "No existing venv found; creating $venv"
        python -m venv $venv
    }
}

Write-Host "[2/6] Activating virtualenv at: $venv"
$activate = Join-Path $venv "Scripts\Activate.ps1"
if (Test-Path $activate) {
    & $activate
} else {
    Write-Error "Activation script not found at $activate. Virtualenv may be invalid."
    exit 1
}

# Prefer using the venv's python executable when available for robust execution
$pythonExe = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = "python" }

Write-Host "[3/6] Upgrading pip and installing requirements..."
& $pythonExe -m pip install --upgrade pip
if (Test-Path ".\requirements.txt") {
    & $pythonExe -m pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found; skipping package installation."
}

Write-Host "[4/6] Creating and applying migrations..."
& $pythonExe manage.py makemigrations
& $pythonExe manage.py migrate

Write-Host "[5/6] Seeding default users (if available)..."
try {
    & $pythonExe manage.py seed_users
} catch {
    Write-Warning "seed_users command failed or is not present. Continuing..."
}

if (-not $NoRunServer) {
    Write-Host "[6/6] Starting Django development server..."
    & $pythonExe manage.py runserver
} else {
    Write-Host "Setup finished. Skipping runserver because `-NoRunServer` was passed."
}
