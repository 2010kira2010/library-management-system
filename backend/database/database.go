package database

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"library-management/backend/models"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// Init инициализирует подключение к базе данных
func Init(dataSourceName string) error {
	var err error
	db, err = sql.Open("sqlite3", dataSourceName)
	if err != nil {
		return err
	}

	// Проверяем подключение
	if err = db.Ping(); err != nil {
		return err
	}

	// Создаем таблицы
	if err = createTables(); err != nil {
		return err
	}

	return nil
}

// Close закрывает подключение к базе данных
func Close() error {
	if db != nil {
		return db.Close()
	}
	return nil
}

// createTables создает таблицы из schema.sql
func createTables() error {
	schema, err := ioutil.ReadFile("../database/schema.sql")
	if err != nil {
		// Если файл не найден, используем встроенную схему
		schema = []byte(embeddedSchema)
	}

	_, err = db.Exec(string(schema))
	return err
}

// GetBooks возвращает список книг с пагинацией и поиском
func GetBooks(search string, page, pageSize int) ([]models.Book, int, error) {
	offset := (page - 1) * pageSize

	// Базовый запрос
	baseQuery := `
		SELECT b.*, a.*, p.*,
			CASE WHEN l.id IS NULL THEN 1 ELSE 0 END as is_available
		FROM books b
		LEFT JOIN authors a ON b.author_id = a.id
		LEFT JOIN publishers p ON b.publisher_id = p.id
		LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'active'
		WHERE 1=1
	`

	// Добавляем условия поиска
	var args []interface{}
	if search != "" {
		baseQuery += ` AND (
			b.title LIKE ? OR 
			b.barcode LIKE ? OR 
			b.isbn LIKE ? OR
			a.last_name LIKE ? OR
			p.name LIKE ?
		)`
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Получаем общее количество
	countQuery := "SELECT COUNT(DISTINCT b.id) FROM books b LEFT JOIN authors a ON b.author_id = a.id LEFT JOIN publishers p ON b.publisher_id = p.id LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'active' WHERE 1=1"
	if search != "" {
		countQuery += ` AND (b.title LIKE ? OR b.barcode LIKE ? OR b.isbn LIKE ? OR a.last_name LIKE ? OR p.name LIKE ?)`
	}

	var total int
	row := db.QueryRow(countQuery, args...)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Добавляем пагинацию
	baseQuery += " ORDER BY b.code LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	// Выполняем запрос
	rows, err := db.Query(baseQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var book models.Book
		var author models.Author
		var publisher models.Publisher

		err := rows.Scan(
			&book.ID, &book.Code, &book.Title, &book.ShortTitle,
			&book.AuthorID, &book.PublisherID, &book.PublicationYear,
			&book.Barcode, &book.ISBN, &book.BBK, &book.UDK,
			&book.ClassRange, &book.Location, &book.CreatedAt, &book.CreatedBy,
			&author.ID, &author.Code, &author.LastName, &author.FirstName,
			&author.MiddleName, &author.ShortName, &author.CreatedAt,
			&publisher.ID, &publisher.Code, &publisher.Name, &publisher.CreatedAt,
			&book.IsAvailable,
		)
		if err != nil {
			continue
		}

		if book.AuthorID != nil {
			book.Author = &author
		}
		if book.PublisherID != nil {
			book.Publisher = &publisher
		}

		books = append(books, book)
	}

	return books, total, nil
}

// GetBookByID возвращает книгу по ID
func GetBookByID(id int) (*models.Book, error) {
	query := `
		SELECT b.*, a.*, p.*,
			CASE WHEN l.id IS NULL THEN 1 ELSE 0 END as is_available
		FROM books b
		LEFT JOIN authors a ON b.author_id = a.id
		LEFT JOIN publishers p ON b.publisher_id = p.id
		LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'active'
		WHERE b.id = ?
	`

	var book models.Book
	var author models.Author
	var publisher models.Publisher

	row := db.QueryRow(query, id)
	err := row.Scan(
		&book.ID, &book.Code, &book.Title, &book.ShortTitle,
		&book.AuthorID, &book.PublisherID, &book.PublicationYear,
		&book.Barcode, &book.ISBN, &book.BBK, &book.UDK,
		&book.ClassRange, &book.Location, &book.CreatedAt, &book.CreatedBy,
		&author.ID, &author.Code, &author.LastName, &author.FirstName,
		&author.MiddleName, &author.ShortName, &author.CreatedAt,
		&publisher.ID, &publisher.Code, &publisher.Name, &publisher.CreatedAt,
		&book.IsAvailable,
	)

	if err != nil {
		return nil, err
	}

	if book.AuthorID != nil {
		book.Author = &author
	}
	if book.PublisherID != nil {
		book.Publisher = &publisher
	}

	return &book, nil
}

// GetBookByBarcode возвращает книгу по штрих-коду
func GetBookByBarcode(barcode string) (*models.Book, error) {
	query := `
		SELECT b.*, a.*, p.*,
			CASE WHEN l.id IS NULL THEN 1 ELSE 0 END as is_available
		FROM books b
		LEFT JOIN authors a ON b.author_id = a.id
		LEFT JOIN publishers p ON b.publisher_id = p.id
		LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'active'
		WHERE b.barcode = ?
	`

	var book models.Book
	var author models.Author
	var publisher models.Publisher

	row := db.QueryRow(query, barcode)
	err := row.Scan(
		&book.ID, &book.Code, &book.Title, &book.ShortTitle,
		&book.AuthorID, &book.PublisherID, &book.PublicationYear,
		&book.Barcode, &book.ISBN, &book.BBK, &book.UDK,
		&book.ClassRange, &book.Location, &book.CreatedAt, &book.CreatedBy,
		&author.ID, &author.Code, &author.LastName, &author.FirstName,
		&author.MiddleName, &author.ShortName, &author.CreatedAt,
		&publisher.ID, &publisher.Code, &publisher.Name, &publisher.CreatedAt,
		&book.IsAvailable,
	)

	if err != nil {
		return nil, err
	}

	if book.AuthorID != nil {
		book.Author = &author
	}
	if book.PublisherID != nil {
		book.Publisher = &publisher
	}

	return &book, nil
}

// CreateBook создает новую книгу
func CreateBook(book *models.Book) (int, error) {
	query := `
		INSERT INTO books (
			code, title, short_title, author_id, publisher_id,
			publication_year, barcode, isbn, bbk, udk,
			class_range, location, created_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		book.Code, book.Title, book.ShortTitle, book.AuthorID,
		book.PublisherID, book.PublicationYear, book.Barcode,
		book.ISBN, book.BBK, book.UDK, book.ClassRange,
		book.Location, book.CreatedBy,
	)

	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateBook обновляет книгу
func UpdateBook(book *models.Book) error {
	query := `
		UPDATE books SET
			title = ?, short_title = ?, author_id = ?,
			publisher_id = ?, publication_year = ?, barcode = ?,
			isbn = ?, bbk = ?, udk = ?, class_range = ?, location = ?
		WHERE id = ?
	`

	_, err := db.Exec(query,
		book.Title, book.ShortTitle, book.AuthorID,
		book.PublisherID, book.PublicationYear, book.Barcode,
		book.ISBN, book.BBK, book.UDK, book.ClassRange,
		book.Location, book.ID,
	)

	return err
}

// DeleteBook удаляет книгу
func DeleteBook(id int) error {
	_, err := db.Exec("DELETE FROM books WHERE id = ?", id)
	return err
}

// IsBookLoaned проверяет, выдана ли книга
func IsBookLoaned(bookID int) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM loans WHERE book_id = ? AND status = 'active'",
		bookID,
	).Scan(&count)

	return count > 0, err
}

// GenerateBookCode генерирует код для книги
func GenerateBookCode() string {
	var maxCode int
	db.QueryRow("SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) FROM books WHERE code GLOB '[0-9]*'").Scan(&maxCode)
	return fmt.Sprintf("%06d", maxCode+1)
}

// GetUserByUsername возвращает пользователя по имени
func GetUserByUsername(username string) (*models.User, error) {
	query := `SELECT id, username, password_hash, full_name, role, created_at 
			  FROM users WHERE username = ?`

	var user models.User
	err := db.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.PasswordHash,
		&user.FullName, &user.Role, &user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetDashboardStats возвращает статистику для главной страницы
func GetDashboardStats() (*models.DashboardStats, error) {
	stats := &models.DashboardStats{}

	// Всего книг
	err := db.QueryRow("SELECT COUNT(*) FROM books").Scan(&stats.TotalBooks)
	if err != nil {
		return nil, err
	}

	// Доступные книги
	err = db.QueryRow(`
		SELECT COUNT(*) FROM books b 
		LEFT JOIN loans l ON b.id = l.book_id AND l.status = 'active' 
		WHERE l.id IS NULL
	`).Scan(&stats.AvailableBooks)
	if err != nil {
		return nil, err
	}

	// Всего читателей
	err = db.QueryRow("SELECT COUNT(*) FROM readers").Scan(&stats.TotalReaders)
	if err != nil {
		return nil, err
	}

	// Активные выдачи
	err = db.QueryRow("SELECT COUNT(*) FROM loans WHERE status = 'active'").Scan(&stats.ActiveLoans)
	if err != nil {
		return nil, err
	}

	// Выдано сегодня
	today := time.Now().Format("2006-01-02")
	err = db.QueryRow(
		"SELECT COUNT(*) FROM loans WHERE DATE(issue_date) = ?",
		today,
	).Scan(&stats.TodayIssued)
	if err != nil {
		return nil, err
	}

	// Возвращено сегодня
	err = db.QueryRow(
		"SELECT COUNT(*) FROM loans WHERE DATE(return_date) = ? AND status = 'returned'",
		today,
	).Scan(&stats.TodayReturned)
	if err != nil {
		return nil, err
	}

	// Просроченные (более 30 дней)
	err = db.QueryRow(`
		SELECT COUNT(*) FROM loans 
		WHERE status = 'active' 
		AND julianday('now') - julianday(issue_date) > 30
	`).Scan(&stats.OverdueLoans)
	if err != nil {
		return nil, err
	}

	return stats, nil
}

// GetReaderByBarcode возвращает читателя по штрих-коду
func GetReaderByBarcode(barcode string) (*models.Reader, error) {
	query := `
		SELECT r.*, 
			(SELECT COUNT(*) FROM loans WHERE reader_id = r.id AND status = 'active') as active_loans_count
		FROM readers r
		WHERE r.barcode = ?
	`

	var reader models.Reader
	var birthDate sql.NullTime

	err := db.QueryRow(query, barcode).Scan(
		&reader.ID, &reader.Code, &reader.Barcode,
		&reader.LastName, &reader.FirstName, &reader.MiddleName,
		&reader.UserType, &reader.ClassID, &reader.Grade,
		&reader.Gender, &birthDate, &reader.Address,
		&reader.DocumentType, &reader.DocumentNumber,
		&reader.Phone, &reader.Email, &reader.Photo,
		&reader.ParentMotherName, &reader.ParentMotherPhone,
		&reader.ParentFatherName, &reader.ParentFatherPhone,
		&reader.GuardianName, &reader.GuardianPhone,
		&reader.CreatedAt, &reader.CreatedBy, &reader.Comments,
		&reader.ActiveLoansCount,
	)

	if err != nil {
		return nil, err
	}

	if birthDate.Valid {
		reader.BirthDate = &birthDate.Time
	}

	return &reader, nil
}

// GetActiveLoanByBookID возвращает активную выдачу по ID книги
func GetActiveLoanByBookID(bookID int) (*models.Loan, error) {
	query := `
		SELECT l.*, b.*, r.*
		FROM loans l
		INNER JOIN books b ON l.book_id = b.id
		INNER JOIN readers r ON l.reader_id = r.id
		WHERE l.book_id = ? AND l.status = 'active'
	`

	var loan models.Loan
	var book models.Book
	var reader models.Reader

	row := db.QueryRow(query, bookID)

	// Сканируем данные выдачи
	err := row.Scan(
		&loan.ID, &loan.BookID, &loan.ReaderID,
		&loan.IssueDate, &loan.ReturnDate,
		&loan.IssuedBy, &loan.ReturnedBy, &loan.Status,
		// Данные книги
		&book.ID, &book.Code, &book.Title, &book.ShortTitle,
		&book.AuthorID, &book.PublisherID, &book.PublicationYear,
		&book.Barcode, &book.ISBN, &book.BBK, &book.UDK,
		&book.ClassRange, &book.Location, &book.CreatedAt, &book.CreatedBy,
		// Данные читателя
		&reader.ID, &reader.Code, &reader.Barcode,
		&reader.LastName, &reader.FirstName, &reader.MiddleName,
		&reader.UserType, &reader.ClassID, &reader.Grade,
		&reader.Gender, &reader.BirthDate, &reader.Address,
		&reader.DocumentType, &reader.DocumentNumber,
		&reader.Phone, &reader.Email, &reader.Photo,
		&reader.ParentMotherName, &reader.ParentMotherPhone,
		&reader.ParentFatherName, &reader.ParentFatherPhone,
		&reader.GuardianName, &reader.GuardianPhone,
		&reader.CreatedAt, &reader.CreatedBy, &reader.Comments,
	)

	if err != nil {
		return nil, err
	}

	loan.Book = &book
	loan.Reader = &reader

	return &loan, nil
}

// CreateLoan создает новую выдачу книги
func CreateLoan(loan *models.Loan) (int, error) {
	query := `
		INSERT INTO loans (book_id, reader_id, issue_date, issued_by, status)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		loan.BookID, loan.ReaderID, loan.IssueDate,
		loan.IssuedBy, loan.Status,
	)

	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateLoan обновляет информацию о выдаче
func UpdateLoan(loan *models.Loan) error {
	query := `
		UPDATE loans SET
			return_date = ?, returned_by = ?, status = ?
		WHERE id = ?
	`

	_, err := db.Exec(query,
		loan.ReturnDate, loan.ReturnedBy, loan.Status, loan.ID,
	)

	return err
}

// GetActiveLoans возвращает список активных выдач
func GetActiveLoans(search string) ([]models.Loan, error) {
	query := `
		SELECT l.id, l.book_id, l.reader_id, l.issue_date, l.issued_by, l.status,
			   b.title, b.barcode, b.short_title,
			   r.last_name, r.first_name, r.middle_name, r.barcode, r.grade
		FROM loans l
		INNER JOIN books b ON l.book_id = b.id
		INNER JOIN readers r ON l.reader_id = r.id
		WHERE l.status = 'active'
	`

	var args []interface{}
	if search != "" {
		query += ` AND (
			b.title LIKE ? OR b.barcode LIKE ? OR
			r.last_name LIKE ? OR r.barcode LIKE ?
		)`
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	query += " ORDER BY l.issue_date DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []models.Loan
	for rows.Next() {
		var loan models.Loan
		var book models.Book
		var reader models.Reader

		err := rows.Scan(
			&loan.ID, &loan.BookID, &loan.ReaderID,
			&loan.IssueDate, &loan.IssuedBy, &loan.Status,
			&book.Title, &book.Barcode, &book.ShortTitle,
			&reader.LastName, &reader.FirstName, &reader.MiddleName,
			&reader.Barcode, &reader.Grade,
		)
		if err != nil {
			continue
		}

		loan.Book = &book
		loan.Reader = &reader

		// Вычисляем количество дней
		loan.DaysOnLoan = int(time.Since(loan.IssueDate).Hours() / 24)

		loans = append(loans, loan)
	}

	return loans, nil
}

// GetLoanHistory возвращает историю выдач
func GetLoanHistory(bookID, readerID int, dateFrom, dateTo string) ([]models.Loan, error) {
	query := `
		SELECT l.id, l.book_id, l.reader_id, l.issue_date, l.return_date,
			   l.issued_by, l.returned_by, l.status,
			   b.title, b.barcode,
			   r.last_name, r.first_name, r.middle_name, r.barcode
		FROM loans l
		INNER JOIN books b ON l.book_id = b.id
		INNER JOIN readers r ON l.reader_id = r.id
		WHERE 1=1
	`

	var args []interface{}

	if bookID > 0 {
		query += " AND l.book_id = ?"
		args = append(args, bookID)
	}

	if readerID > 0 {
		query += " AND l.reader_id = ?"
		args = append(args, readerID)
	}

	if dateFrom != "" {
		query += " AND DATE(l.issue_date) >= ?"
		args = append(args, dateFrom)
	}

	if dateTo != "" {
		query += " AND DATE(l.issue_date) <= ?"
		args = append(args, dateTo)
	}

	query += " ORDER BY l.issue_date DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []models.Loan
	for rows.Next() {
		var loan models.Loan
		var book models.Book
		var reader models.Reader

		err := rows.Scan(
			&loan.ID, &loan.BookID, &loan.ReaderID,
			&loan.IssueDate, &loan.ReturnDate,
			&loan.IssuedBy, &loan.ReturnedBy, &loan.Status,
			&book.Title, &book.Barcode,
			&reader.LastName, &reader.FirstName, &reader.MiddleName, &reader.Barcode,
		)
		if err != nil {
			continue
		}

		loan.Book = &book
		loan.Reader = &reader

		if loan.ReturnDate != nil {
			loan.DaysOnLoan = int(loan.ReturnDate.Sub(loan.IssueDate).Hours() / 24)
		} else {
			loan.DaysOnLoan = int(time.Since(loan.IssueDate).Hours() / 24)
		}

		loans = append(loans, loan)
	}

	return loans, nil
}

// GetReaders возвращает список читателей с пагинацией
func GetReaders(search string, page, pageSize int) ([]models.Reader, int, error) {
	offset := (page - 1) * pageSize

	baseQuery := `
		SELECT r.*, 
			(SELECT COUNT(*) FROM loans WHERE reader_id = r.id AND status = 'active') as active_loans_count
		FROM readers r
		WHERE 1=1
	`

	var args []interface{}
	if search != "" {
		baseQuery += ` AND (
			r.last_name LIKE ? OR 
			r.first_name LIKE ? OR 
			r.barcode LIKE ? OR
			r.phone LIKE ?
		)`
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Получаем общее количество
	countQuery := "SELECT COUNT(*) FROM readers r WHERE 1=1"
	if search != "" {
		countQuery += ` AND (r.last_name LIKE ? OR r.first_name LIKE ? OR r.barcode LIKE ? OR r.phone LIKE ?)`
	}

	var total int
	row := db.QueryRow(countQuery, args...)
	if err := row.Scan(&total); err != nil {
		return nil, 0, err
	}

	// Добавляем пагинацию
	baseQuery += " ORDER BY r.last_name, r.first_name LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := db.Query(baseQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var readers []models.Reader
	for rows.Next() {
		var reader models.Reader
		var birthDate sql.NullTime

		err := rows.Scan(
			&reader.ID, &reader.Code, &reader.Barcode,
			&reader.LastName, &reader.FirstName, &reader.MiddleName,
			&reader.UserType, &reader.ClassID, &reader.Grade,
			&reader.Gender, &birthDate, &reader.Address,
			&reader.DocumentType, &reader.DocumentNumber,
			&reader.Phone, &reader.Email, &reader.Photo,
			&reader.ParentMotherName, &reader.ParentMotherPhone,
			&reader.ParentFatherName, &reader.ParentFatherPhone,
			&reader.GuardianName, &reader.GuardianPhone,
			&reader.CreatedAt, &reader.CreatedBy, &reader.Comments,
			&reader.ActiveLoansCount,
		)
		if err != nil {
			continue
		}

		if birthDate.Valid {
			reader.BirthDate = &birthDate.Time
		}

		readers = append(readers, reader)
	}

	return readers, total, nil
}

// GetReaderByID возвращает читателя по ID
func GetReaderByID(id int) (*models.Reader, error) {
	query := `
		SELECT r.*, 
			(SELECT COUNT(*) FROM loans WHERE reader_id = r.id AND status = 'active') as active_loans_count
		FROM readers r
		WHERE r.id = ?
	`

	var reader models.Reader
	var birthDate sql.NullTime

	err := db.QueryRow(query, id).Scan(
		&reader.ID, &reader.Code, &reader.Barcode,
		&reader.LastName, &reader.FirstName, &reader.MiddleName,
		&reader.UserType, &reader.ClassID, &reader.Grade,
		&reader.Gender, &birthDate, &reader.Address,
		&reader.DocumentType, &reader.DocumentNumber,
		&reader.Phone, &reader.Email, &reader.Photo,
		&reader.ParentMotherName, &reader.ParentMotherPhone,
		&reader.ParentFatherName, &reader.ParentFatherPhone,
		&reader.GuardianName, &reader.GuardianPhone,
		&reader.CreatedAt, &reader.CreatedBy, &reader.Comments,
		&reader.ActiveLoansCount,
	)

	if err != nil {
		return nil, err
	}

	if birthDate.Valid {
		reader.BirthDate = &birthDate.Time
	}

	return &reader, nil
}

// CreateReader создает нового читателя
func CreateReader(reader *models.Reader) (int, error) {
	query := `
		INSERT INTO readers (
			code, barcode, last_name, first_name, middle_name,
			user_type, class_id, grade, gender, birth_date,
			address, document_type, document_number, phone, email,
			photo, parent_mother_name, parent_mother_phone,
			parent_father_name, parent_father_phone,
			guardian_name, guardian_phone, created_by, comments
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		reader.Code, reader.Barcode, reader.LastName, reader.FirstName, reader.MiddleName,
		reader.UserType, reader.ClassID, reader.Grade, reader.Gender, reader.BirthDate,
		reader.Address, reader.DocumentType, reader.DocumentNumber, reader.Phone, reader.Email,
		reader.Photo, reader.ParentMotherName, reader.ParentMotherPhone,
		reader.ParentFatherName, reader.ParentFatherPhone,
		reader.GuardianName, reader.GuardianPhone, reader.CreatedBy, reader.Comments,
	)

	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateReader обновляет читателя
func UpdateReader(reader *models.Reader) error {
	query := `
		UPDATE readers SET
			last_name = ?, first_name = ?, middle_name = ?,
			user_type = ?, class_id = ?, grade = ?, gender = ?,
			birth_date = ?, address = ?, document_type = ?,
			document_number = ?, phone = ?, email = ?, photo = ?,
			parent_mother_name = ?, parent_mother_phone = ?,
			parent_father_name = ?, parent_father_phone = ?,
			guardian_name = ?, guardian_phone = ?, comments = ?
		WHERE id = ?
	`

	_, err := db.Exec(query,
		reader.LastName, reader.FirstName, reader.MiddleName,
		reader.UserType, reader.ClassID, reader.Grade, reader.Gender,
		reader.BirthDate, reader.Address, reader.DocumentType,
		reader.DocumentNumber, reader.Phone, reader.Email, reader.Photo,
		reader.ParentMotherName, reader.ParentMotherPhone,
		reader.ParentFatherName, reader.ParentFatherPhone,
		reader.GuardianName, reader.GuardianPhone, reader.Comments,
		reader.ID,
	)

	return err
}

// DeleteReader удаляет читателя
func DeleteReader(id int) error {
	_, err := db.Exec("DELETE FROM readers WHERE id = ?", id)
	return err
}

// ReaderHasActiveLoans проверяет, есть ли у читателя активные выдачи
func ReaderHasActiveLoans(readerID int) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM loans WHERE reader_id = ? AND status = 'active'",
		readerID,
	).Scan(&count)

	return count > 0, err
}

// GenerateReaderCode генерирует код для читателя
func GenerateReaderCode() string {
	var maxCode int
	db.QueryRow("SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) FROM readers WHERE code GLOB '[0-9]*'").Scan(&maxCode)
	return fmt.Sprintf("%06d", maxCode+1)
}

// GetAuthors возвращает список авторов
func GetAuthors() ([]models.Author, error) {
	query := `
		SELECT a.*, COUNT(b.id) as book_count
		FROM authors a
		LEFT JOIN books b ON a.id = b.author_id
		GROUP BY a.id
		ORDER BY a.last_name, a.first_name
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var authors []models.Author
	for rows.Next() {
		var author models.Author
		err := rows.Scan(
			&author.ID, &author.Code, &author.LastName,
			&author.FirstName, &author.MiddleName,
			&author.ShortName, &author.CreatedAt,
			&author.BookCount,
		)
		if err != nil {
			continue
		}
		authors = append(authors, author)
	}

	return authors, nil
}

// CreateAuthor создает нового автора
func CreateAuthor(author *models.Author) (int, error) {
	query := `
		INSERT INTO authors (code, last_name, first_name, middle_name, short_name)
		VALUES (?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		author.Code, author.LastName, author.FirstName,
		author.MiddleName, author.ShortName,
	)

	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateAuthor обновляет автора
func UpdateAuthor(author *models.Author) error {
	query := `
		UPDATE authors SET
			last_name = ?, first_name = ?, middle_name = ?, short_name = ?
		WHERE id = ?
	`

	_, err := db.Exec(query,
		author.LastName, author.FirstName,
		author.MiddleName, author.ShortName,
		author.ID,
	)

	return err
}

// DeleteAuthor удаляет автора
func DeleteAuthor(id int) error {
	_, err := db.Exec("DELETE FROM authors WHERE id = ?", id)
	return err
}

// AuthorHasBooks проверяет, есть ли книги у автора
func AuthorHasBooks(authorID int) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM books WHERE author_id = ?",
		authorID,
	).Scan(&count)

	return count > 0, err
}

// GenerateAuthorCode генерирует код для автора
func GenerateAuthorCode() string {
	var maxCode int
	db.QueryRow("SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) FROM authors WHERE code GLOB '[0-9]*'").Scan(&maxCode)
	return fmt.Sprintf("%05d", maxCode+1)
}

// GetPublishers возвращает список издательств
func GetPublishers() ([]models.Publisher, error) {
	query := `
		SELECT p.*, COUNT(b.id) as book_count
		FROM publishers p
		LEFT JOIN books b ON p.id = b.publisher_id
		GROUP BY p.id
		ORDER BY p.name
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var publishers []models.Publisher
	for rows.Next() {
		var publisher models.Publisher
		err := rows.Scan(
			&publisher.ID, &publisher.Code,
			&publisher.Name, &publisher.CreatedAt,
			&publisher.BookCount,
		)
		if err != nil {
			continue
		}
		publishers = append(publishers, publisher)
	}

	return publishers, nil
}

// CreatePublisher создает новое издательство
func CreatePublisher(publisher *models.Publisher) (int, error) {
	query := `INSERT INTO publishers (code, name) VALUES (?, ?)`

	result, err := db.Exec(query, publisher.Code, publisher.Name)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdatePublisher обновляет издательство
func UpdatePublisher(publisher *models.Publisher) error {
	_, err := db.Exec(
		"UPDATE publishers SET name = ? WHERE id = ?",
		publisher.Name, publisher.ID,
	)
	return err
}

// DeletePublisher удаляет издательство
func DeletePublisher(id int) error {
	_, err := db.Exec("DELETE FROM publishers WHERE id = ?", id)
	return err
}

// PublisherHasBooks проверяет, есть ли книги у издательства
func PublisherHasBooks(publisherID int) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM books WHERE publisher_id = ?",
		publisherID,
	).Scan(&count)

	return count > 0, err
}

// GeneratePublisherCode генерирует код для издательства
func GeneratePublisherCode() string {
	var maxCode int
	db.QueryRow("SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) FROM publishers WHERE code GLOB '[0-9]*'").Scan(&maxCode)
	return fmt.Sprintf("%05d", maxCode+1)
}

// GetDisks возвращает список дисков
func GetDisks(search string) ([]models.Disk, error) {
	query := `
		SELECT d.*, p.name,
			CASE WHEN dl.id IS NULL THEN 1 ELSE 0 END as is_available
		FROM disks d
		LEFT JOIN publishers p ON d.publisher_id = p.id
		LEFT JOIN disk_loans dl ON d.id = dl.disk_id AND dl.status = 'active'
		WHERE 1=1
	`

	var args []interface{}
	if search != "" {
		query += ` AND (
			d.title LIKE ? OR d.barcode LIKE ? OR
			d.subject LIKE ? OR d.resource_type LIKE ?
		)`
		searchPattern := "%" + search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	query += " ORDER BY d.title"

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var disks []models.Disk
	for rows.Next() {
		var disk models.Disk
		var publisherName sql.NullString

		err := rows.Scan(
			&disk.ID, &disk.Code, &disk.Title, &disk.ShortTitle,
			&disk.PublisherID, &disk.Subject, &disk.ResourceType,
			&disk.Barcode, &disk.CreatedAt, &disk.CreatedBy,
			&disk.Comments, &publisherName, &disk.IsAvailable,
		)
		if err != nil {
			continue
		}

		if publisherName.Valid && disk.PublisherID != nil {
			disk.Publisher = &models.Publisher{
				ID:   *disk.PublisherID,
				Name: publisherName.String,
			}
		}

		disks = append(disks, disk)
	}

	return disks, nil
}

// CreateDisk создает новый диск
func CreateDisk(disk *models.Disk) (int, error) {
	query := `
		INSERT INTO disks (
			code, title, short_title, publisher_id,
			subject, resource_type, barcode, created_by, comments
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := db.Exec(query,
		disk.Code, disk.Title, disk.ShortTitle, disk.PublisherID,
		disk.Subject, disk.ResourceType, disk.Barcode,
		disk.CreatedBy, disk.Comments,
	)

	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateDisk обновляет диск
func UpdateDisk(disk *models.Disk) error {
	query := `
		UPDATE disks SET
			title = ?, short_title = ?, publisher_id = ?,
			subject = ?, resource_type = ?, barcode = ?, comments = ?
		WHERE id = ?
	`

	_, err := db.Exec(query,
		disk.Title, disk.ShortTitle, disk.PublisherID,
		disk.Subject, disk.ResourceType, disk.Barcode,
		disk.Comments, disk.ID,
	)

	return err
}

// DeleteDisk удаляет диск
func DeleteDisk(id int) error {
	_, err := db.Exec("DELETE FROM disks WHERE id = ?", id)
	return err
}

// IsDiskLoaned проверяет, выдан ли диск
func IsDiskLoaned(diskID int) (bool, error) {
	var count int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM disk_loans WHERE disk_id = ? AND status = 'active'",
		diskID,
	).Scan(&count)

	return count > 0, err
}

// GenerateDiskCode генерирует код для диска
func GenerateDiskCode() string {
	var maxCode int
	db.QueryRow("SELECT COALESCE(MAX(CAST(code AS INTEGER)), 0) FROM disks WHERE code GLOB '[0-9]*'").Scan(&maxCode)
	return fmt.Sprintf("%05d", maxCode+1)
}

// GetSettings возвращает настройки системы
func GetSettings() (*models.Settings, error) {
	query := `SELECT id, organization_name, organization_short_name, director_name, updated_at FROM settings LIMIT 1`

	var settings models.Settings
	err := db.QueryRow(query).Scan(
		&settings.ID, &settings.OrganizationName,
		&settings.OrganizationShortName, &settings.DirectorName,
		&settings.UpdatedAt,
	)

	if err != nil {
		// Если настроек нет, создаем пустые
		if err == sql.ErrNoRows {
			_, err = db.Exec("INSERT INTO settings DEFAULT VALUES")
			if err != nil {
				return nil, err
			}
			return &models.Settings{ID: 1}, nil
		}
		return nil, err
	}

	return &settings, nil
}

// UpdateSettings обновляет настройки системы
func UpdateSettings(settings *models.Settings) error {
	query := `
		UPDATE settings SET
			organization_name = ?, organization_short_name = ?,
			director_name = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`

	_, err := db.Exec(query,
		settings.OrganizationName, settings.OrganizationShortName,
		settings.DirectorName,
	)

	return err
}

// GetClasses возвращает список классов
func GetClasses() ([]models.Class, error) {
	query := `SELECT id, grade, letter, teacher_name FROM classes ORDER BY grade, letter`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var classes []models.Class
	for rows.Next() {
		var class models.Class
		err := rows.Scan(&class.ID, &class.Grade, &class.Letter, &class.TeacherName)
		if err != nil {
			continue
		}
		class.DisplayName = fmt.Sprintf("%d \"%s\"", class.Grade, class.Letter)
		classes = append(classes, class)
	}

	return classes, nil
}

// GetLibraryUsers возвращает список пользователей библиотеки
func GetLibraryUsers() ([]models.User, error) {
	query := `SELECT id, username, full_name, role FROM users ORDER BY full_name`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.Username, &user.FullName, &user.Role)
		if err != nil {
			continue
		}
		users = append(users, user)
	}

	return users, nil
}

// GetBookAvailabilityReport генерирует отчет о наличии книг
func GetBookAvailabilityReport(classFilter string) (interface{}, error) {
	// TODO: Implement book availability report
	return nil, nil
}

// GetLoanHistoryReport генерирует отчет истории выдач
func GetLoanHistoryReport(bookID, readerID int, dateFrom, dateTo, operation string) (interface{}, error) {
	// TODO: Implement loan history report
	return nil, nil
}

// GetClassLoansReport генерирует ведомость выданных книг по классу
func GetClassLoansReport(classID int) (interface{}, error) {
	// TODO: Implement class loans report
	return nil, nil
}

// Встроенная схема базы данных
const embeddedSchema = `
-- Минимальная схема для работы
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'librarian',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    title TEXT NOT NULL,
    short_title TEXT,
    author_id INTEGER,
    publisher_id INTEGER,
    publication_year INTEGER,
    barcode TEXT UNIQUE,
    isbn TEXT,
    bbk TEXT,
    udk TEXT,
    class_range TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    last_name TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    short_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS publishers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    barcode TEXT UNIQUE,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    user_type TEXT DEFAULT 'student',
    class_id INTEGER,
    grade INTEGER,
    gender TEXT,
    birth_date DATE,
    address TEXT,
    document_type TEXT,
    document_number TEXT,
    phone TEXT,
    email TEXT,
    photo BLOB,
    parent_mother_name TEXT,
    parent_mother_phone TEXT,
    parent_father_name TEXT,
    parent_father_phone TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    comments TEXT
);

CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    reader_id INTEGER NOT NULL,
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME,
    issued_by INTEGER NOT NULL,
    returned_by INTEGER,
    status TEXT DEFAULT 'active'
);

-- Создаем пользователя по умолчанию (пароль: admin)
INSERT OR IGNORE INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2a$12$8y8HG8bKxOqGj50zi/LdeempqTKXnVi0Xfcz/vMzFexKEXXIDnVN2', 'Администратор', 'admin');
`
