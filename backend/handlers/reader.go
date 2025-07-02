package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetReaders возвращает список читателей
func GetReaders(c *fiber.Ctx) error {
	search := c.Query("search", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "10"))

	readers, total, err := database.GetReaders(search, page, pageSize)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch readers",
		})
	}

	return c.JSON(fiber.Map{
		"readers": readers,
		"pagination": fiber.Map{
			"page":     page,
			"pageSize": pageSize,
			"total":    total,
		},
	})
}

// GetReader возвращает читателя по ID
func GetReader(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid reader ID",
		})
	}

	reader, err := database.GetReaderByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Reader not found",
		})
	}

	return c.JSON(reader)
}

// GetReaderByBarcode возвращает читателя по штрих-коду
func GetReaderByBarcode(c *fiber.Ctx) error {
	barcode := c.Params("barcode")

	reader, err := database.GetReaderByBarcode(barcode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Reader not found",
		})
	}

	return c.JSON(reader)
}

// CreateReader создает нового читателя
func CreateReader(c *fiber.Ctx) error {
	var reader models.Reader
	if err := c.BodyParser(&reader); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем ID пользователя из контекста
	userID := c.Locals("userID").(int)
	reader.CreatedBy = userID

	// Генерируем код если не указан
	if reader.Code == "" {
		reader.Code = database.GenerateReaderCode()
	}

	// Создаем читателя
	id, err := database.CreateReader(&reader)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create reader",
		})
	}

	reader.ID = id
	return c.Status(201).JSON(reader)
}

// UpdateReader обновляет читателя
func UpdateReader(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid reader ID",
		})
	}

	var reader models.Reader
	if err := c.BodyParser(&reader); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	reader.ID = id
	if err := database.UpdateReader(&reader); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update reader",
		})
	}

	return c.JSON(reader)
}

// DeleteReader удаляет читателя
func DeleteReader(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid reader ID",
		})
	}

	// Проверяем, нет ли активных выдач
	hasActiveLoans, err := database.ReaderHasActiveLoans(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check reader status",
		})
	}

	if hasActiveLoans {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot delete reader with active loans",
		})
	}

	if err := database.DeleteReader(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete reader",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Reader deleted successfully",
	})
}
