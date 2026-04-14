$path = "D:\PERFIL\Desktop\PROJETOS\SIS OBRAS\frontend\public"
$files = Get-ChildItem -Path $path -Filter "*.html" -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -notmatch 'config\.js') {
        $content = $content -replace '</head>', '<script src="/js/config.js"></script></head>'
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
