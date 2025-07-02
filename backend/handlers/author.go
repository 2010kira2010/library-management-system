package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// GetAuthors возвращает список авторов
func GetAuthors(c *fiber.Ctx) error {
	authors, err := database.GetAuthors()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch authors",
		})
	}

	return c.JSON(authors)
}

// CreateAuthor создает нового автора
func CreateAuthor(c *fiber.Ctx) error {
	var author models.Author
	if err := c.BodyParser(&author); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Генерируем код если не указан
	if author.Code == "" {
		author.Code = database.GenerateAuthorCode()
	}

	// Формируем краткое имя если не указано
	if author.ShortName == "" && author.LastName != "" {
		firstInitial := ""
		if author.FirstName != "" {
			firstInitial = string([]rune(author.FirstName)[0]) + "."
		}
		middleInitial := ""
		if author.MiddleName != "" {
			middleInitial = string([]rune(author.MiddleName)[0]) + "."
		}
		author.ShortName = author.LastName + " " + firstInitial + middleInitial
	}

	id, err := database.CreateAuthor(&author)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create author",
		})
	}

	author.ID = id
	return c.Status(201).JSON(author)
}

// UpdateAuthor обновляет автора
func UpdateAuthor(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid author ID",
		})
	}

	var author models.Author
	if err := c.BodyParser(&author); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	author.ID = id
	if err := database.UpdateAuthor(&author); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update author",
		})
	}

	return c.JSON(author)
}

// DeleteAuthor удаляет автора
func DeleteAuthor(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid author ID",
		})
	}

	// Проверяем, есть ли книги у автора
	hasBooks, err := database.AuthorHasBooks(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check author status",
		})
	}

	if hasBooks {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot delete author with existing books",
		})
	}

	if err := database.DeleteAuthor(id); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete author",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Author deleted successfully",
	})
}
