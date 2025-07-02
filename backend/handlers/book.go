package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetBooks возвращает список книг
func GetBooks(c *fiber.Ctx) error {
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	books, total, err := database.GetBooks(search, page, pageSize)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch books",
		})
	}

	return c.JSON(fiber.Map{
		"books": books,
		"pagination": fiber.Map{
			"page":     page,
			"pageSize": pageSize,
			"total":    total,
		},
	})
}

// GetBook возвращает книгу по ID
func GetBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid book ID",
		})
	}

	book, err := database.GetBookByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Book not found",
		})
	}

	return c.JSON(book)
}

// GetBookByBarcode возвращает книгу по штрих-коду
func GetBookByBarcode(c *fiber.Ctx) error {
	barcode := c.Params("barcode")

	book, err := database.GetBookByBarcode(barcode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Book not found",
		})
	}

	return c.JSON(book)
}

// CreateBook создает новую книгу
func CreateBook(c *fiber.Ctx) error {
	var book models.Book
	if err := c.BodyParser(&book); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем ID пользователя из контекста
	userID := c.Locals("userID").(int)
	book.CreatedBy = userID

	// Генерируем код если не указан
	if book.Code == "" {
		book.Code = database.GenerateBookCode()
	}

	// Создаем книгу
	id, err := database.CreateBook(&book)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create book",
		})
	}

	book.ID = id
	return c.Status(201).JSON(book)
}

// UpdateBook обновляет книгу
func UpdateBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid book ID",
		})
	}

	var book models.Book
	if err := c.BodyParser(&book); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	book.ID = id
	if err := database.UpdateBook(&book); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update book",
		})
	}

	return c.JSON(book)
}

// DeleteBook удаляет книгу
func DeleteBook(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid book ID",
		})
	}

	// Проверяем, не выдана ли книга
	isLoaned, err := database.IsBookLoaned(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check book status",
		})
	}

	if isLoaned {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot delete book that is currently loaned",
		})
	}

	if err := database.DeleteBook(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete book",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Book deleted successfully",
	})
}
