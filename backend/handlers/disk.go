package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetDisks возвращает список дисков
func GetDisks(c *fiber.Ctx) error {
	search := c.Query("search", "")
	disks, err := database.GetDisks(search)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch disks",
		})
	}

	return c.JSON(disks)
}

// CreateDisk создает новый диск
func CreateDisk(c *fiber.Ctx) error {
	var disk models.Disk
	if err := c.BodyParser(&disk); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем ID пользователя из контекста
	userID := c.Locals("userID").(int)
	disk.CreatedBy = userID

	// Генерируем код если не указан
	if disk.Code == "" {
		disk.Code = database.GenerateDiskCode()
	}

	id, err := database.CreateDisk(&disk)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create disk",
		})
	}

	disk.ID = id
	return c.Status(201).JSON(disk)
}

// UpdateDisk обновляет диск
func UpdateDisk(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid disk ID",
		})
	}

	var disk models.Disk
	if err := c.BodyParser(&disk); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	disk.ID = id
	if err := database.UpdateDisk(&disk); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update disk",
		})
	}

	return c.JSON(disk)
}

// DeleteDisk удаляет диск
func DeleteDisk(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid disk ID",
		})
	}

	// Проверяем, не выдан ли диск
	isLoaned, err := database.IsDiskLoaned(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check disk status",
		})
	}

	if isLoaned {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot delete disk that is currently loaned",
		})
	}

	if err := database.DeleteDisk(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete disk",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Disk deleted successfully",
	})
}
