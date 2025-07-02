package handlers

import (
	"database/sql"
	"library-management/backend/database"
	"library-management/backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("your-secret-key-change-this-in-production")

// Login обрабатывает вход пользователя
func Login(c *fiber.Ctx) error {
	var req models.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Cannot parse request body",
		})
	}

	// Получаем пользователя из БД
	user, err := database.GetUserByUsername(req.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(401).JSON(fiber.Map{
				"error": "Invalid username or password",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Database error",
		})
	}
	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid username or password",
		})
	}
	// Создаем JWT токен
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = user.ID
	claims["username"] = user.Username
	claims["role"] = user.Role
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix() // Токен действителен 24 часа

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Could not generate token",
		})
	}

	// Убираем хеш пароля из ответа
	user.PasswordHash = ""
	return c.JSON(models.LoginResponse{
		Token: tokenString,
		User:  *user,
	})
}

// GetDashboardStats возвращает статистику для главной страницы
func GetDashboardStats(c *fiber.Ctx) error {
	stats, err := database.GetDashboardStats()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get dashboard stats",
		})
	}

	return c.JSON(stats)
}
