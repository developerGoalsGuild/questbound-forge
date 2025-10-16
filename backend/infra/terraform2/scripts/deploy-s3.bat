@echo off
REM Batch file wrapper for S3 stack deployment
REM This provides a simpler interface for Windows users

setlocal enabledelayedexpansion

REM Default values
set ENV=dev
set PLAN_ONLY=
set AUTO_APPROVE=-AutoApprove
set SKIP_INIT=
set LOG_PATH=

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :execute
if "%~1"=="-env" (
    set ENV=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-plan" (
    set PLAN_ONLY=-PlanOnly
    shift
    goto :parse_args
)
if "%~1"=="-no-approve" (
    set AUTO_APPROVE=-AutoApprove:$false
    shift
    goto :parse_args
)
if "%~1"=="-skip-init" (
    set SKIP_INIT=-SkipInit
    shift
    goto :parse_args
)
if "%~1"=="-log-path" (
    set LOG_PATH=-TfLogPath "%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="-help" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="/?" goto :show_help

echo Unknown parameter: %~1
goto :show_help

:show_help
echo.
echo S3 Stack Deployment Script
echo =========================
echo.
echo Usage: deploy-s3.bat [options]
echo.
echo Options:
echo   -env <environment>    Environment to deploy (dev, staging, prod, local, test)
echo   -plan                 Only run terraform plan, don't apply changes
echo   -no-approve          Don't auto-approve terraform apply
echo   -skip-init           Skip terraform init step
echo   -log-path <path>     Custom path for terraform log file
echo   -help                Show this help message
echo.
echo Examples:
echo   deploy-s3.bat -env dev
echo   deploy-s3.bat -env prod -plan
echo   deploy-s3.bat -env staging -no-approve
echo.
goto :end

:execute
echo.
echo S3 Stack Deployment
echo ===================
echo Environment: %ENV%
echo Plan Only: %PLAN_ONLY%
echo Auto Approve: %AUTO_APPROVE%
echo Skip Init: %SKIP_INIT%
echo Log Path: %LOG_PATH%
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo Error: PowerShell is not available or not in PATH
    echo Please ensure PowerShell is installed and accessible
    goto :end
)

REM Execute the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-s3.ps1" -Env %ENV% %PLAN_ONLY% %AUTO_APPROVE% %SKIP_INIT% %LOG_PATH%

if errorlevel 1 (
    echo.
    echo Deployment failed with error code: %errorlevel%
    goto :end
)

echo.
echo Deployment completed successfully!

:end
endlocal

