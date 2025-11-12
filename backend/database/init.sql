-- DIHAC Database Schema

CREATE DATABASE IF NOT EXISTS dihac;
USE dihac;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    status ENUM('draft', 'in_progress', 'analyzed', 'archived') DEFAULT 'draft',
    case_indicator ENUM('thumbs_up', 'thumbs_down', 'pending') DEFAULT 'pending',
    win_probability DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    user_message TEXT NOT NULL,
    system_response TEXT,
    message_type ENUM('text', 'voice', 'evidence', 'witness') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Witnesses Table
CREATE TABLE IF NOT EXISTS witnesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255),
    statement TEXT,
    relationship VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relevant Laws Table
CREATE TABLE IF NOT EXISTS relevant_laws (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    law_title VARCHAR(500) NOT NULL,
    law_url VARCHAR(1000),
    law_code VARCHAR(100),
    description TEXT,
    relevance_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Precedent Cases Table
CREATE TABLE IF NOT EXISTS precedent_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    case_name VARCHAR(500) NOT NULL,
    case_citation VARCHAR(255),
    case_url VARCHAR(1000),
    court VARCHAR(255),
    year INT,
    relevance_description TEXT,
    relevance_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Legal Contacts Table
CREATE TABLE IF NOT EXISTS legal_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    firm_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    website VARCHAR(500),
    specialization VARCHAR(255),
    rating DECIMAL(3,2),
    rank_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Case Analysis Table
CREATE TABLE IF NOT EXISTS case_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL UNIQUE,
    analysis_summary TEXT,
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    llm_model_used VARCHAR(100),
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    INDEX idx_case_id (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- RAG Documents Table (for legal knowledge base)
CREATE TABLE IF NOT EXISTS rag_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_title VARCHAR(500) NOT NULL,
    document_content TEXT NOT NULL,
    document_type VARCHAR(100),
    source_url VARCHAR(1000),
    embedding_vector JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

