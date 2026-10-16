<#
.SYNOPSIS
  Deja configurada la seguridad del repositorio de Golf Plan en GitHub.

.DESCRIPTION
  Hace con la API de GitHub (a través de GitHub CLI, "gh") los ajustes que exigen ser administrador:
    1. Comprueba que tu cuenta tiene la verificación en dos pasos (si no, abre la página para activarla).
    2. Protege la rama main con una regla (ruleset): sin force push ni borrado, con pull request
       y con el test de CI obligatorio.
    3. Activa las alertas y actualizaciones de seguridad de Dependabot, el secret scanning,
       la protección al subir (push protection) y los avisos privados de vulnerabilidades.
    4. Deja el token de GitHub Actions en solo lectura por defecto.
    5. Publica GitHub Pages con GitHub Actions.
    6. Abre bestpractices.dev para solicitar la insignia (es un formulario, se rellena a mano).
  Al final vuelve a leer cada ajuste y muestra un resumen. Se puede ejecutar varias veces.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\configurar-github.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\configurar-github.ps1 -SoloComprobar
#>
param(
  [string]$Repo = 'PruebaGHluis/App',
  [switch]$SoloComprobar
)

$ErrorActionPreference = 'Stop'
$RulesetName = 'Proteger main'
$CheckName = 'test'   # job "test" del workflow "CI y publicación"

function Paso($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "   OK  $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "   !!  $texto" -ForegroundColor Yellow }

# gh api con cuerpo JSON opcional; devuelve el objeto o $null si la respuesta está vacía.
function Api([string]$Method, [string]$Path, $Body = $null) {
  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 10 -Compress
    $out = $json | gh api --method $Method -H 'Accept: application/vnd.github+json' $Path --input -
  } else {
    $out = gh api --method $Method -H 'Accept: application/vnd.github+json' $Path
  }
  if ($LASTEXITCODE -ne 0) { throw "Falló $Method $Path" }
  if ($out) { return ($out | Out-String | ConvertFrom-Json) }
  return $null
}

# ── 0. Requisitos ──
Paso 'Requisitos'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Aviso 'Falta GitHub CLI. Instálalo con:  winget install --id GitHub.cli   y vuelve a abrir la terminal.'
  exit 1
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Aviso 'No has iniciado sesión en GitHub CLI. Ejecuta:  gh auth login   (elige GitHub.com y el navegador).'
  exit 1
}
$user = Api GET 'user'
$repoInfo = Api GET "repos/$Repo"
Ok "Sesión iniciada como $($user.login); repositorio $($repoInfo.full_name) ($($repoInfo.visibility))."
if (-not $repoInfo.permissions.admin) {
  Aviso "Tu cuenta no es administradora de $Repo. Inicia sesión con la cuenta propietaria (gh auth login)."
  exit 1
}

# ── 1. Verificación en dos pasos ──
Paso '1. Verificación en dos pasos'
if ($user.two_factor_authentication) {
  Ok 'Ya está activada en tu cuenta.'
} else {
  Aviso 'No está activada. Se abre la página de seguridad de tu cuenta: pulsa "Enable two-factor authentication".'
  if (-not $SoloComprobar) { Start-Process 'https://github.com/settings/security' }
}

if (-not $SoloComprobar) {
  # ── 2. Regla de protección de main ──
  Paso '2. Proteger la rama main'
  $ruleset = @{
    name        = $RulesetName
    target      = 'branch'
    enforcement = 'active'
    conditions  = @{ ref_name = @{ include = @('~DEFAULT_BRANCH'); exclude = @() } }
    rules       = @(
      @{ type = 'deletion' },
      @{ type = 'non_fast_forward' },
      # Pull request obligatorio. 0 aprobaciones: con un solo mantenedor no hay quien apruebe.
      @{ type = 'pull_request'; parameters = @{
          required_approving_review_count   = 0
          dismiss_stale_reviews_on_push     = $true
          require_code_owner_review         = $false
          require_last_push_approval        = $false
          required_review_thread_resolution = $false } },
      @{ type = 'required_status_checks'; parameters = @{
          strict_required_status_checks_policy = $false
          required_status_checks               = @(@{ context = $CheckName }) } }
    )
  }
  $existing = @(Api GET "repos/$Repo/rulesets") | Where-Object { $_.name -eq $RulesetName }
  if ($existing) {
    Api PUT "repos/$Repo/rulesets/$($existing[0].id)" $ruleset | Out-Null
    Ok "Regla '$RulesetName' actualizada."
  } else {
    Api POST "repos/$Repo/rulesets" $ruleset | Out-Null
    Ok "Regla '$RulesetName' creada."
  }

  # ── 3. Seguridad del código ──
  Paso '3. Dependabot, secret scanning y avisos privados'
  Api PUT "repos/$Repo/vulnerability-alerts" | Out-Null
  Ok 'Alertas de Dependabot activadas.'
  Api PUT "repos/$Repo/automated-security-fixes" | Out-Null
  Ok 'Actualizaciones de seguridad de Dependabot activadas.'
  Api PATCH "repos/$Repo" @{ security_and_analysis = @{
      secret_scanning                 = @{ status = 'enabled' }
      secret_scanning_push_protection = @{ status = 'enabled' } } } | Out-Null
  Ok 'Secret scanning y push protection activados.'
  Api PUT "repos/$Repo/private-vulnerability-reporting" | Out-Null
  Ok 'Avisos privados de vulnerabilidades activados.'

  # ── 4. Permisos del token de Actions ──
  Paso '4. Token de GitHub Actions en solo lectura'
  Api PUT "repos/$Repo/actions/permissions/workflow" @{
    default_workflow_permissions     = 'read'
    can_approve_pull_request_reviews = $false } | Out-Null
  Ok 'Permisos por defecto: solo lectura.'

  # ── 5. GitHub Pages con Actions ──
  Paso '5. GitHub Pages desde GitHub Actions'
  $pages = $null
  try { $pages = Api GET "repos/$Repo/pages" } catch { }
  if (-not $pages) {
    Api POST "repos/$Repo/pages" @{ build_type = 'workflow' } | Out-Null
    Ok 'Pages creado con GitHub Actions como fuente.'
  } elseif ($pages.build_type -ne 'workflow') {
    Api PUT "repos/$Repo/pages" @{ build_type = 'workflow' } | Out-Null
    Ok 'Fuente de Pages cambiada a GitHub Actions.'
  } else {
    Ok 'Pages ya publica con GitHub Actions.'
  }

  # ── 6. Insignia de buenas prácticas ──
  Paso '6. Insignia de bestpractices.dev'
  Aviso "Se abre bestpractices.dev: entra con GitHub, añade https://github.com/$Repo y responde el cuestionario."
  Start-Process 'https://www.bestpractices.dev/es/projects/new'
}

# ── Resumen ──
Paso 'Comprobación final'
$repoInfo = Api GET "repos/$Repo"
$sa = $repoInfo.security_and_analysis
$alerts = $true; try { Api GET "repos/$Repo/vulnerability-alerts" | Out-Null } catch { $alerts = $false }
$pvr = Api GET "repos/$Repo/private-vulnerability-reporting"
$wf = Api GET "repos/$Repo/actions/permissions/workflow"
$pagesNow = $null; try { $pagesNow = Api GET "repos/$Repo/pages" } catch { }
$rs = @(Api GET "repos/$Repo/rulesets") | Where-Object { $_.name -eq $RulesetName -and $_.enforcement -eq 'active' }

$resumen = [ordered]@{
  'Verificación en dos pasos'     = [bool]$user.two_factor_authentication
  'Regla de protección de main'   = [bool]$rs
  'Alertas de Dependabot'         = $alerts
  'Secret scanning'               = $sa.secret_scanning.status -eq 'enabled'
  'Push protection'               = $sa.secret_scanning_push_protection.status -eq 'enabled'
  'Avisos privados'               = [bool]$pvr.enabled
  'Token de Actions solo lectura' = $wf.default_workflow_permissions -eq 'read'
  'Pages con GitHub Actions'      = $pagesNow.build_type -eq 'workflow'
}
foreach ($k in $resumen.Keys) {
  if ($resumen[$k]) { Ok $k } else { Aviso "$k  (pendiente)" }
}
Write-Host "`nLa insignia de bestpractices.dev no se puede comprobar desde aquí: mira tu proyecto en https://www.bestpractices.dev" -ForegroundColor DarkGray
