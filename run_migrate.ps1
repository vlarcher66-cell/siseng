$env:DB_HOST = 'monorail.proxy.rlwy.net'
$env:DB_PORT = '15359'
$env:DB_USER = 'root'
$env:DB_PASS = 'HdWwDNadQKuwfmMGIpMZWEWadOKDaYcn'
$env:DB_NAME = 'railway'
Set-Location "D:\PERFIL\Desktop\PROJETOS\SIS OBRAS\backend"
node src/config/migrate_compras.js
node src/config/migrate_fornecedores.js
