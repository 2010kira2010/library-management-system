package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"

	"github.com/gofiber/fiber/v2"
)

// GetSettings возвращает настройки системы
func GetSettings(c *fiber.Ctx) error {
	settings, err := database.GetSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch settings",
		})
	}

	classes, err := database.GetClasses()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch classes",
		})
	}

	users, err := database.GetLibraryUsers()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	return c.JSON(fiber.Map{
		"settings": settings,
		"classes":  classes,
		"users":    users,
	})
}

// UpdateSettings обновляет настройки системы
func UpdateSettings(c *fiber.Ctx) error {
	var settings models.Settings
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	if err := database.UpdateSettings(&settings); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update settings",
		})
	}

	return c.JSON(settings)
}
