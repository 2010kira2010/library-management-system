package models

import (
	"database/sql/driver"
	"time"
)

// User представляет пользователя системы (библиотекаря)
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// Book представляет книгу
type Book struct {
	ID              int        `json:"id"`
	Code            string     `json:"code"`
	Title           string     `json:"title"`
	ShortTitle      string     `json:"short_title"`
	AuthorID        *int       `json:"author_id"`
	Author          *Author    `json:"author,omitempty"`
	PublisherID     *int       `json:"publisher_id"`
	Publisher       *Publisher `json:"publisher,omitempty"`
	PublicationYear *int       `json:"publication_year"`
	Barcode         string     `json:"barcode"`
	ISBN            string     `json:"isbn"`
	BBK             string     `json:"bbk"`
	UDK             string     `json:"udk"`
	ClassRange      string     `json:"class_range"`
	Location        string     `json:"location"`
	CreatedAt       time.Time  `json:"created_at"`
	CreatedBy       int        `json:"created_by"`
	IsAvailable     bool       `json:"is_available"`
}

// Reader представляет читателя (абонента)
type Reader struct {
	ID                int        `json:"id"`
	Code              string     `json:"code"`
	Barcode           string     `json:"barcode"`
	LastName          string     `json:"last_name"`
	FirstName         string     `json:"first_name"`
	MiddleName        string     `json:"middle_name"`
	UserType          string     `json:"user_type"`
	ClassID           *int       `json:"class_id"`
	Class             *Class     `json:"class,omitempty"`
	Grade             *int       `json:"grade"`
	Gender            string     `json:"gender"`
	BirthDate         *time.Time `json:"birth_date"`
	Address           string     `json:"address"`
	DocumentType      string     `json:"document_type"`
	DocumentNumber    string     `json:"document_number"`
	Phone             string     `json:"phone"`
	Email             string     `json:"email"`
	Photo             []byte     `json:"photo,omitempty"`
	ParentMotherName  string     `json:"parent_mother_name"`
	ParentMotherPhone string     `json:"parent_mother_phone"`
	ParentFatherName  string     `json:"parent_father_name"`
	ParentFatherPhone string     `json:"parent_father_phone"`
	GuardianName      string     `json:"guardian_name"`
	GuardianPhone     string     `json:"guardian_phone"`
	CreatedAt         time.Time  `json:"created_at"`
	CreatedBy         int        `json:"created_by"`
	Comments          string     `json:"comments"`
	ActiveLoansCount  int        `json:"active_loans_count"`
}

// Author представляет автора
type Author struct {
	ID         int       `json:"id"`
	Code       string    `json:"code"`
	LastName   string    `json:"last_name"`
	FirstName  string    `json:"first_name"`
	MiddleName string    `json:"middle_name"`
	ShortName  string    `json:"short_name"`
	CreatedAt  time.Time `json:"created_at"`
	BookCount  int       `json:"book_count"`
}

// Publisher представляет издательство
type Publisher struct {
	ID        int       `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	BookCount int       `json:"book_count"`
}

// Class представляет класс
type Class struct {
	ID          int    `json:"id"`
	Grade       int    `json:"grade"`
	Letter      string `json:"letter"`
	TeacherName string `json:"teacher_name"`
	DisplayName string `json:"display_name"`
}

// Loan представляет выдачу книги
type Loan struct {
	ID           int        `json:"id"`
	BookID       int        `json:"book_id"`
	Book         *Book      `json:"book,omitempty"`
	ReaderID     int        `json:"reader_id"`
	Reader       *Reader    `json:"reader,omitempty"`
	IssueDate    time.Time  `json:"issue_date"`
	ReturnDate   *time.Time `json:"return_date"`
	IssuedBy     int        `json:"issued_by"`
	IssuedByUser *User      `json:"issued_by_user,omitempty"`
	ReturnedBy   *int       `json:"returned_by"`
	Status       string     `json:"status"`
	DaysOnLoan   int        `json:"days_on_loan"`
}

// Disk представляет диск
type Disk struct {
	ID           int        `json:"id"`
	Code         string     `json:"code"`
	Title        string     `json:"title"`
	ShortTitle   string     `json:"short_title"`
	PublisherID  *int       `json:"publisher_id"`
	Publisher    *Publisher `json:"publisher,omitempty"`
	Subject      string     `json:"subject"`
	ResourceType string     `json:"resource_type"`
	Barcode      string     `json:"barcode"`
	CreatedAt    time.Time  `json:"created_at"`
	CreatedBy    int        `json:"created_by"`
	Comments     string     `json:"comments"`
	IsAvailable  bool       `json:"is_available"`
}

// Settings представляет настройки системы
type Settings struct {
	ID                    int       `json:"id"`
	OrganizationName      string    `json:"organization_name"`
	OrganizationShortName string    `json:"organization_short_name"`
	DirectorName          string    `json:"director_name"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// LoginRequest представляет запрос на вход
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse представляет ответ на вход
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// IssueBookRequest представляет запрос на выдачу книги
type IssueBookRequest struct {
	BookBarcode   string `json:"book_barcode"`
	ReaderBarcode string `json:"reader_barcode"`
}

// ReturnBookRequest представляет запрос на возврат книги
type ReturnBookRequest struct {
	BookBarcode string `json:"book_barcode"`
}

// DashboardStats представляет статистику для главной страницы
type DashboardStats struct {
	TotalBooks     int `json:"total_books"`
	AvailableBooks int `json:"available_books"`
	TotalReaders   int `json:"total_readers"`
	ActiveLoans    int `json:"active_loans"`
	TodayIssued    int `json:"today_issued"`
	TodayReturned  int `json:"today_returned"`
	OverdueLoans   int `json:"overdue_loans"`
}

// Pagination представляет параметры пагинации
type Pagination struct {
	Page     int `json:"page"`
	PageSize int `json:"page_size"`
	Total    int `json:"total"`
}

// NullTime для работы с NULL датами
type NullTime struct {
	Time  time.Time
	Valid bool
}

func (nt *NullTime) Scan(value interface{}) error {
	nt.Time, nt.Valid = value.(time.Time)
	return nil
}

func (nt NullTime) Value() (driver.Value, error) {
	if !nt.Valid {
		return nil, nil
	}
	return nt.Time, nil
}
