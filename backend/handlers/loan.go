package handlers

import (
	"library-management/backend/database"
	"library-management/backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// IssueBook обрабатывает выдачу книги
func IssueBook(c *fiber.Ctx) error {
	var req models.IssueBookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем ID пользователя из контекста
	userID := c.Locals("userID").(int)

	// Проверяем книгу
	book, err := database.GetBookByBarcode(req.BookBarcode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Книга не найдена",
		})
	}

	if !book.IsAvailable {
		// Получаем информацию о том, кому выдана книга
		loan, _ := database.GetActiveLoanByBookID(book.ID)
		if loan != nil && loan.Reader != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Книга уже выдана",
				"details": fiber.Map{
					"reader":     loan.Reader.LastName + " " + loan.Reader.FirstName,
					"issue_date": loan.IssueDate.Format("02.01.2006"),
				},
			})
		}
		return c.Status(400).JSON(fiber.Map{
			"error": "Книга недоступна для выдачи",
		})
	}

	// Проверяем читателя
	reader, err := database.GetReaderByBarcode(req.ReaderBarcode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Абонент не найден",
		})
	}

	// Создаем запись о выдаче
	loan := &models.Loan{
		BookID:    book.ID,
		ReaderID:  reader.ID,
		IssueDate: time.Now(),
		IssuedBy:  userID,
		Status:    "active",
	}

	loanID, err := database.CreateLoan(loan)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Не удалось выдать книгу",
		})
	}

	loan.ID = loanID
	loan.Book = book
	loan.Reader = reader

	return c.Status(201).JSON(fiber.Map{
		"message": "Книга успешно выдана",
		"loan":    loan,
	})
}

// ReturnBook обрабатывает возврат книги
func ReturnBook(c *fiber.Ctx) error {
	var req models.ReturnBookRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем ID пользователя из контекста
	userID := c.Locals("userID").(int)

	// Находим книгу
	book, err := database.GetBookByBarcode(req.BookBarcode)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Книга не найдена",
		})
	}

	// Находим активную выдачу
	loan, err := database.GetActiveLoanByBookID(book.ID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Не найдена активная выдача для этой книги",
		})
	}

	// Обновляем запись о выдаче
	now := time.Now()
	loan.ReturnDate = &now
	loan.ReturnedBy = &userID
	loan.Status = "returned"

	if err := database.UpdateLoan(loan); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Не удалось оформить возврат книги",
		})
	}

	// Вычисляем количество дней
	daysOnLoan := int(now.Sub(loan.IssueDate).Hours() / 24)

	return c.JSON(fiber.Map{
		"message": "Книга успешно возвращена",
		"loan": fiber.Map{
			"book":         book,
			"reader":       loan.Reader,
			"issue_date":   loan.IssueDate,
			"return_date":  loan.ReturnDate,
			"days_on_loan": daysOnLoan,
		},
	})
}

// GetActiveLoans возвращает список активных выдач
func GetActiveLoans(c *fiber.Ctx) error {
	search := c.Query("search", "")

	loans, err := database.GetActiveLoans(search)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch active loans",
		})
	}

	// Добавляем количество дней для каждой выдачи
	now := time.Now()
	for i := range loans {
		loans[i].DaysOnLoan = int(now.Sub(loans[i].IssueDate).Hours() / 24)
	}

	return c.JSON(loans)
}

// GetLoanHistory возвращает историю выдач
func GetLoanHistory(c *fiber.Ctx) error {
	bookID := c.QueryInt("book_id", 0)
	readerID := c.QueryInt("reader_id", 0)
	dateFrom := c.Query("date_from", "")
	dateTo := c.Query("date_to", "")

	loans, err := database.GetLoanHistory(bookID, readerID, dateFrom, dateTo)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch loan history",
		})
	}

	return c.JSON(loans)
}
