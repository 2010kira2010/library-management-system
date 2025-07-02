package main

import (
	"embed"
	"github.com/gofiber/fiber/v2"
	"library-management/backend/config"
	"library-management/backend/database"
	"library-management/backend/handlers"
	"library-management/backend/middleware"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

//go:embed frontend/dist/*
var frontendFS embed.FS

func main() {
	// Загрузка конфигурации
	cfg := config.Load()

	// Инициализация базы данных
	if err := database.Init(cfg.DatabasePath); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()

	// Создание Fiber приложения
	app := fiber.New(fiber.Config{
		AppName: "Библиотека v1.0",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// API Routes
	api := app.Group("/api")

	// Публичные маршруты
	api.Post("/auth/login", handlers.Login)

	// Защищенные маршруты
	protected := api.Group("/", middleware.AuthMiddleware)

	// Книги
	protected.Get("/books", handlers.GetBooks)
	protected.Get("/books/:id", handlers.GetBook)
	protected.Post("/books", handlers.CreateBook)
	protected.Put("/books/:id", handlers.UpdateBook)
	protected.Delete("/books/:id", handlers.DeleteBook)
	protected.Get("/books/barcode/:barcode", handlers.GetBookByBarcode)

	// Читатели (абоненты)
	protected.Get("/readers", handlers.GetReaders)
	protected.Get("/readers/:id", handlers.GetReader)
	protected.Post("/readers", handlers.CreateReader)
	protected.Put("/readers/:id", handlers.UpdateReader)
	protected.Delete("/readers/:id", handlers.DeleteReader)
	protected.Get("/readers/barcode/:barcode", handlers.GetReaderByBarcode)

	// Авторы
	protected.Get("/authors", handlers.GetAuthors)
	protected.Post("/authors", handlers.CreateAuthor)
	protected.Put("/authors/:id", handlers.UpdateAuthor)
	protected.Delete("/authors/:id", handlers.DeleteAuthor)

	// Издательства
	protected.Get("/publishers", handlers.GetPublishers)
	protected.Post("/publishers", handlers.CreatePublisher)
	protected.Put("/publishers/:id", handlers.UpdatePublisher)
	protected.Delete("/publishers/:id", handlers.DeletePublisher)

	// Диски
	protected.Get("/disks", handlers.GetDisks)
	protected.Post("/disks", handlers.CreateDisk)
	protected.Put("/disks/:id", handlers.UpdateDisk)
	protected.Delete("/disks/:id", handlers.DeleteDisk)

	// Выдача/возврат книг
	protected.Post("/loans/issue", handlers.IssueBook)
	protected.Post("/loans/return", handlers.ReturnBook)
	protected.Get("/loans/active", handlers.GetActiveLoans)
	protected.Get("/loans/history", handlers.GetLoanHistory)

	// Отчеты
	protected.Get("/reports/book-availability", handlers.BookAvailabilityReport)
	protected.Get("/reports/loan-history", handlers.LoanHistoryReport)
	protected.Get("/reports/class-loans", handlers.ClassLoansReport)

	// Настройки
	protected.Get("/settings", handlers.GetSettings)
	protected.Post("/settings", handlers.UpdateSettings)

	// Статистика для дашборда
	protected.Get("/dashboard/stats", handlers.GetDashboardStats)

	// Обслуживание frontend как встроенных файлов
	app.Use("/", filesystem.New(filesystem.Config{
		Root:         http.FS(frontendFS),
		PathPrefix:   "frontend/dist",
		Browse:       false,
		NotFoundFile: "frontend/dist/index.html", // Встроенная поддержка fallback
	}))

	// Fallback на index.html для клиентского роутинга
	app.Use("*", func(c *fiber.Ctx) error {
		log.Printf("Fallback triggered for: %s", c.Path())
		return c.SendFile("./frontend/dist/index.html")
	})

	// Запуск сервера
	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
