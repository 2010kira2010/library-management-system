-- Пользователи системы (библиотекари)
CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     username TEXT NOT NULL UNIQUE,
                                     password_hash TEXT NOT NULL,
                                     full_name TEXT NOT NULL,
                                     role TEXT DEFAULT 'librarian',
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Настройки системы
CREATE TABLE IF NOT EXISTS settings (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        organization_name TEXT,
                                        organization_short_name TEXT,
                                        director_name TEXT,
                                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Классы
CREATE TABLE IF NOT EXISTS classes (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       grade INTEGER NOT NULL,
                                       letter TEXT NOT NULL,
                                       teacher_name TEXT,
                                       UNIQUE(grade, letter)
    );

-- Авторы
CREATE TABLE IF NOT EXISTS authors (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       code TEXT UNIQUE,
                                       last_name TEXT NOT NULL,
                                       first_name TEXT,
                                       middle_name TEXT,
                                       short_name TEXT NOT NULL,
                                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Издательства
CREATE TABLE IF NOT EXISTS publishers (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          code TEXT UNIQUE,
                                          name TEXT NOT NULL,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Книги
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
                                     created_by INTEGER,
                                     FOREIGN KEY (author_id) REFERENCES authors(id),
    FOREIGN KEY (publisher_id) REFERENCES publishers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
    );

-- Читатели (абоненты)
CREATE TABLE IF NOT EXISTS readers (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       code TEXT UNIQUE,
                                       barcode TEXT UNIQUE,
                                       last_name TEXT NOT NULL,
                                       first_name TEXT NOT NULL,
                                       middle_name TEXT,
                                       user_type TEXT DEFAULT 'student', -- student, teacher, parent, etc.
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
                                       comments TEXT,
                                       FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
    );

-- Выдача книг
CREATE TABLE IF NOT EXISTS loans (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     book_id INTEGER NOT NULL,
                                     reader_id INTEGER NOT NULL,
                                     issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     return_date DATETIME,
                                     issued_by INTEGER NOT NULL,
                                     returned_by INTEGER,
                                     status TEXT DEFAULT 'active', -- active, returned
                                     FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (reader_id) REFERENCES readers(id),
    FOREIGN KEY (issued_by) REFERENCES users(id),
    FOREIGN KEY (returned_by) REFERENCES users(id)
    );

-- Диски
CREATE TABLE IF NOT EXISTS disks (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     code TEXT UNIQUE,
                                     title TEXT NOT NULL,
                                     short_title TEXT,
                                     publisher_id INTEGER,
                                     subject TEXT,
                                     resource_type TEXT, -- program, interactive_map, video, etc.
                                     barcode TEXT UNIQUE,
                                     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     created_by INTEGER,
                                     comments TEXT,
                                     FOREIGN KEY (publisher_id) REFERENCES publishers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
    );

-- Выдача дисков
CREATE TABLE IF NOT EXISTS disk_loans (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          disk_id INTEGER NOT NULL,
                                          reader_id INTEGER NOT NULL,
                                          issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          return_date DATETIME,
                                          issued_by INTEGER NOT NULL,
                                          returned_by INTEGER,
                                          status TEXT DEFAULT 'active',
                                          FOREIGN KEY (disk_id) REFERENCES disks(id),
    FOREIGN KEY (reader_id) REFERENCES readers(id),
    FOREIGN KEY (issued_by) REFERENCES users(id),
    FOREIGN KEY (returned_by) REFERENCES users(id)
    );

-- Предметы
CREATE TABLE IF NOT EXISTS subjects (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        name TEXT NOT NULL,
                                        short_name TEXT
);

-- Типы ЭОР
CREATE TABLE IF NOT EXISTS resource_types (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              name TEXT NOT NULL
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_books_barcode ON books(barcode);
CREATE INDEX IF NOT EXISTS idx_readers_barcode ON readers(barcode);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_reader ON loans(reader_id);
CREATE INDEX IF NOT EXISTS idx_loans_book ON loans(book_id);

-- Вставка начальных данных
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$12$8y8HG8bKxOqGj50zi/LdeempqTKXnVi0Xfcz/vMzFexKEXXIDnVN2', 'Администратор', 'admin');

INSERT INTO settings (organization_name, organization_short_name)
VALUES ('Муниципальное бюджетное общеобразовательное учреждение средняя образовательная школа №3', 'МБОУСОШ №3');