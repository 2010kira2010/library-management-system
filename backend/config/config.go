package config

import (
	"os"
)

// Config содержит настройки приложения
type Config struct {
	Port         string
	DatabasePath string
	JWTSecret    string
}

// Load загружает конфигурацию из переменных окружения
func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "3000"),
		DatabasePath: getEnv("DATABASE_PATH", "./library.db"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"),
	}
}

// getEnv возвращает значение переменной окружения или значение по умолчанию
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
