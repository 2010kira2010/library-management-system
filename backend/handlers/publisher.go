package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetPublishers возвращает список издательств
func GetPublishers(c *fiber.Ctx) error {
	publishers, err := database.GetPublishers()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch publishers",
		})
	}

	return c.JSON(publishers)
}

// CreatePublisher создает новое издательство
func CreatePublisher(c *fiber.Ctx) error {
	var publisher models.Publisher
	if err := c.BodyParser(&publisher); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Генерируем код если не указан
	if publisher.Code == "" {
		publisher.Code = database.GeneratePublisherCode()
	}

	id, err := database.CreatePublisher(&publisher)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create publisher",
		})
	}

	publisher.ID = id
	return c.Status(201).JSON(publisher)
}

// UpdatePublisher обновляет издательство
func UpdatePublisher(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid publisher ID",
		})
	}

	var publisher models.Publisher
	if err := c.BodyParser(&publisher); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	publisher.ID = id
	if err := database.UpdatePublisher(&publisher); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update publisher",
		})
	}

	return c.JSON(publisher)
}

// DeletePublisher удаляет издательство
func DeletePublisher(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid publisher ID",
		})
	}

	// Проверяем, есть ли книги у издательства
	hasBooks, err := database.PublisherHasBooks(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check publisher status",
		})
	}

	if hasBooks {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot delete publisher with existing books",
		})
	}

	if err := database.DeletePublisher(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete publisher",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Publisher deleted successfully",
	})
}
