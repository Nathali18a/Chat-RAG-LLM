@echo off
REM Script de verificación - Funcionalidades avanzadas RAG

echo.
echo ====================================
echo  VERIFICACION - CHATBOT RAG AVANZADO
echo ====================================
echo.

cd /d e:\chatbot-rag\api

echo [1/5] Verificando dependencias instaladas...
npm list tesseract.js mammoth xlsx unzipper 2>nul | findstr "tesseract.js"
if %errorlevel% equ 0 (
    echo ✅ Librerías instaladas correctamente
) else (
    echo ⚠️ Falta instalar: npm install tesseract.js mammoth xlsx unzipper
    exit /b 1
)

echo.
echo [2/5] Verificando módulos creados...
if exist src\chunking.js (
    echo ✅ chunking.js
) else (
    echo ❌ chunking.js NO ENCONTRADO
)

if exist src\documentExtractor.js (
    echo ✅ documentExtractor.js
) else (
    echo ❌ documentExtractor.js NO ENCONTRADO
)

if exist src\lightrag.js (
    echo ✅ lightrag.js
) else (
    echo ❌ lightrag.js NO ENCONTRADO
)

if exist src\vectorUtils.js (
    echo ✅ vectorUtils.js
) else (
    echo ❌ vectorUtils.js NO ENCONTRADO
)

if exist src\streaming.js (
    echo ✅ streaming.js
) else (
    echo ❌ streaming.js NO ENCONTRADO
)

echo.
echo [3/5] Variables de entorno requeridas:
if defined OPENAI_API_KEY (
    echo ✅ OPENAI_API_KEY configurada
) else (
    echo ⚠️ OPENAI_API_KEY no configurada (usar mock si necesitas)
)

if defined DEEPSEEK_API_URL (
    echo ✅ DEEPSEEK_API_URL configurada
) else (
    echo ⚠️ DEEPSEEK_API_URL no configurada
)

echo.
echo [4/5] Iniciando servidor...
echo Esperando 3 segundos para que inicie...
timeout /t 3 /nobreak

npm run dev &
set SERVER_PID=%errorlevel%

timeout /t 2 /nobreak

echo.
echo [5/5] Probando health endpoint...
node -e "fetch('http://localhost:3000/health').then(r => r.json()).then(d => {console.log('✅ Servidor respondiendo:'); console.log(JSON.stringify(d, null, 2))}).catch(e => console.error('❌ Error:', e.message))"

echo.
echo ====================================
echo  VERIFICACION COMPLETADA
echo ====================================
echo.
echo 📚 Documentación:
echo   - IMPLEMENTACION_AVANZADA.md
echo   - RESUMEN_IMPLEMENTACION.md
echo.
echo 🧪 Pruebas rápidas:
echo   POST http://localhost:3000/query
echo   POST http://localhost:3000/upload
echo   GET  http://localhost:3000/health
echo.
pause
