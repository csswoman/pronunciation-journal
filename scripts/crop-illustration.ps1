Add-Type -AssemblyName System.Drawing
$srcPath = "C:/Users/karla/.gemini/antigravity/brain/4531f7f9-6cc2-4453-af88-82da7801989a/.user_uploaded/media_1790273591668.png"
$destPath = "d:/proyectos/english-journal/public/images/auth-hero-illustration.png"

$img = [System.Drawing.Bitmap]::FromFile($srcPath)
# Left blue card bounds in image: x=10..522, y=10..637
# Crop illustration part: x=28..504, y=130..555
$rect = New-Object System.Drawing.Rectangle(28, 130, 476, 425)
$cropped = $img.Clone($rect, $img.PixelFormat)
$img.Dispose()
$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
Write-Host "Illustration saved to $destPath"
