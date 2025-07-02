package handlers

import (
	"library-management/backend/database"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// BookAvailabilityReport генерирует отчет о наличии книг
func BookAvailabilityReport(c *fiber.Ctx) error {
	classFilter := c.Query("class", "")

	report, err := database.GetBookAvailabilityReport(classFilter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate report",
		})
	}

	return c.JSON(report)
}

// LoanHistoryReport генерирует отчет истории выдач
func LoanHistoryReport(c *fiber.Ctx) error {
	bookID, _ := strconv.Atoi(c.Query("book_id", "0"))
	readerID, _ := strconv.Atoi(c.Query("reader_id", "0"))
	dateFrom := c.Query("date_from", "")
	dateTo := c.Query("date_to", "")
	operation := c.Query("operation", "") // issue, return, all

	report, err := database.GetLoanHistoryReport(bookID, readerID, dateFrom, dateTo, operation)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate report",
		})
	}

	return c.JSON(report)
}

// ClassLoansReport генерирует ведомость выданных книг по классу
func ClassLoansReport(c *fiber.Ctx) error {
	classID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid class ID",
		})
	}

	report, err := database.GetClassLoansReport(classID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to generate report",
		})
	}

	return c.JSON(report)
}
