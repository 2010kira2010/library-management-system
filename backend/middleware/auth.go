package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key-change-this-in-production")

// AuthMiddleware проверяет JWT токен
func AuthMiddleware(c *fiber.Ctx) error {
	// Получаем токен из заголовка
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Missing authorization header",
		})
	}

	// Проверяем формат заголовка
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid authorization header format",
		})
	}

	tokenString := tokenParts[1]

	// Парсим и валидируем токен
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Проверяем метод подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.ErrUnauthorized
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid or expired token",
		})
	}

	// Извлекаем claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid token claims",
		})
	}

	// Сохраняем информацию о пользователе в контексте
	userID := int(claims["user_id"].(float64))
	username := claims["username"].(string)
	role := claims["role"].(string)

	c.Locals("userID", userID)
	c.Locals("username", username)
	c.Locals("role", role)

	return c.Next()
}
