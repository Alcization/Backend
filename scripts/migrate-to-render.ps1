param(
    [string]$EnvFile = ".env",
    [string]$ExcludedTable = "public.weather_reading",
    [string]$DumpFile = "backups\migrate_no_weather_data.dump"
)

$ErrorActionPreference = "Stop"

function Get-EnvMap {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $envMap = @{}
    Get-Content -Path $Path | ForEach-Object {
        $line = $_.Trim()

        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
            return
        }

        $index = $line.IndexOf("=")
        if ($index -lt 1) {
            return
        }

        $key = $line.Substring(0, $index).Trim()
        $value = $line.Substring($index + 1).Trim()

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        $envMap[$key] = $value
    }

    return $envMap
}

function Ensure-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command '$Name'. Please install PostgreSQL client tools and add them to PATH."
    }
}

function Ensure-SslModeRequire {
    param([string]$DbUrl)

    if ($DbUrl -match "sslmode=") {
        return $DbUrl
    }

    if ($DbUrl.Contains("?")) {
        return "${DbUrl}&sslmode=require"
    }

    return "${DbUrl}?sslmode=require"
}

function Mask-DbUrl {
    param([string]$DbUrl)

    # Avoid strict URI parsing because some valid libpq strings can fail .NET Uri parsing.
    return ($DbUrl -replace '^(postgres(?:ql)?://[^:/?#]+:)([^@]+)@', '$1***@')
}

function Get-TableForVerify {
    param([string]$TableName)

    if ($TableName.Contains(".")) {
        return $TableName
    }

    return "public.$TableName"
}

function Parse-PostgresUrl {
    param([string]$DbUrl)

    try {
        $uri = [System.Uri]$DbUrl

        if (-not $uri.Scheme -or ($uri.Scheme -ne "postgres" -and $uri.Scheme -ne "postgresql")) {
            throw "Unsupported scheme"
        }

        $userInfo = $uri.UserInfo
        if (-not $userInfo -or -not $userInfo.Contains(":")) {
            throw "Missing username/password in URL"
        }

        $parts = $userInfo.Split(":", 2)
        $username = [System.Uri]::UnescapeDataString($parts[0])
        $password = [System.Uri]::UnescapeDataString($parts[1])
        $dbName = $uri.AbsolutePath.TrimStart("/")

        if (-not $dbName) {
            throw "Missing database name in URL path"
        }

        return @{
            Host = $uri.Host
            Port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
            Username = $username
            Password = $password
            Database = $dbName
        }
    }
    catch {
        throw "Invalid EXTERNAL_DATABASE_URL/DATABASE_URL format. Expected: postgresql://user:password@host:5432/dbname"
    }
}

Ensure-Command "pg_dump"
Ensure-Command "pg_restore"
Ensure-Command "psql"

$envMap = Get-EnvMap -Path $EnvFile

$localHost = $envMap["DB_HOST"]
$localPort = $envMap["DB_PORT"]
$localDb = $envMap["DB_NAME"]
$localUser = $envMap["DB_USER"]
$localPassword = $envMap["DB_PASS"]
$renderUrlRaw = if ($envMap["EXTERNAL_DATABASE_URL"]) { $envMap["EXTERNAL_DATABASE_URL"] } else { $envMap["DATABASE_URL"] }

if (-not $localHost -or -not $localPort -or -not $localDb -or -not $localUser -or -not $localPassword) {
    throw "Missing local DB config in .env. Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS"
}

if (-not $renderUrlRaw) {
    throw "Missing EXTERNAL_DATABASE_URL (or DATABASE_URL) in .env"
}

$renderUrl = Ensure-SslModeRequire -DbUrl $renderUrlRaw
$dumpDirectory = Split-Path -Path $DumpFile -Parent
if ($dumpDirectory -and -not (Test-Path $dumpDirectory)) {
    New-Item -ItemType Directory -Path $dumpDirectory | Out-Null
}

$verifyTable = Get-TableForVerify -TableName $ExcludedTable
$renderConn = Parse-PostgresUrl -DbUrl $renderUrl

Write-Host "[1/4] Dump local DB (exclude data from $ExcludedTable)"
Write-Host "  Local source: ${localHost}:$localPort/$localDb"

$env:PGPASSWORD = $localPassword
try {
    & pg_dump `
        --host=$localHost `
        --port=$localPort `
        --username=$localUser `
        --dbname=$localDb `
        --format=custom `
        --no-owner `
        --no-privileges `
        --exclude-table-data=$ExcludedTable `
        --file=$DumpFile

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "[2/4] Restore dump to Render"
Write-Host "  Render target: $($renderConn.Host):$($renderConn.Port)/$($renderConn.Database)"

$env:PGPASSWORD = $renderConn.Password
$env:PGSSLMODE = "require"

& pg_restore `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    "--host=$($renderConn.Host)" `
    "--port=$($renderConn.Port)" `
    "--username=$($renderConn.Username)" `
    "--dbname=$($renderConn.Database)" `
    "$DumpFile"

if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed with exit code $LASTEXITCODE"
}

Write-Host "[3/4] Verify excluded table has no data"
& psql `
    "--host=$($renderConn.Host)" `
    "--port=$($renderConn.Port)" `
    "--username=$($renderConn.Username)" `
    "--dbname=$($renderConn.Database)" `
    -c "SELECT COUNT(*) AS row_count FROM $verifyTable;"

if ($LASTEXITCODE -ne 0) {
    throw "psql verify query failed with exit code $LASTEXITCODE"
}

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue

Write-Host "[4/4] Completed"
Write-Host "  Dump file: $DumpFile"
Write-Host "  Excluded data table: $ExcludedTable"
