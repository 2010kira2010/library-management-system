@echo off
echo Building Library Management System...

echo.
echo Step 1: Building frontend...
cd frontend
call npm install
call npm run build:win
cd ..

echo.
echo Step 2: Copying frontend to backend...
if not exist "backend\frontend\dist" mkdir "backend\frontend\dist"
xcopy /E /Y /I "frontend\dist\*" "backend\frontend\dist\"

echo.
echo Step 3: Building backend...
cd backend
go mod download
set GOOS=windows
set GOARCH=amd64
go build -o library-management.exe main.go
cd ..

echo.
echo Build complete!
echo Run backend\library-management.exe to start the application
echo The application will be available at http://localhost:3000
pause