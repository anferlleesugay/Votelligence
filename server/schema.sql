-- Votelligence: AI-powered Poll & Voting App
-- Creates the database, tables, and sample data.
-- Running it again resets everything back to the sample data.

CREATE DATABASE IF NOT EXISTS votelligence_db;
USE votelligence_db;

-- Drop children first because of the foreign keys
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS poll_options;
DROP TABLE IF EXISTS polls;
DROP TABLE IF EXISTS users;

-- Accounts (login / register)
CREATE TABLE users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(150) NOT NULL UNIQUE,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,      -- bcrypt hash, never the real password
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The main form: one row per poll
CREATE TABLE polls (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  question     VARCHAR(255) NOT NULL,
  description  VARCHAR(500) NULL,
  category     ENUM('school', 'events', 'tech', 'food', 'sports', 'other') NOT NULL,
  closed       BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id     INT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- The answer choices of each poll
CREATE TABLE poll_options (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  poll_id   INT NOT NULL,
  text      VARCHAR(100) NOT NULL,
  position  INT NOT NULL,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

-- One row per vote. UNIQUE (poll_id, voter_fingerprint) = one vote per voter per poll.
CREATE TABLE votes (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  poll_id            INT NOT NULL,
  option_id          INT NOT NULL,
  comment            VARCHAR(500) NULL,
  sentiment          ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE') NULL,   -- filled in by the AI
  voter_fingerprint  VARCHAR(100) NOT NULL,
  voted_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_one_vote_per_voter (poll_id, voter_fingerprint),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
);

-- ---------- Sample data ----------

-- Demo account. Username: demo   Password: demo123
INSERT INTO users (id, email, username, password_hash) VALUES
  (1, 'demo@votelligence.app', 'demo', '$2b$10$R9Pk8TsP31pE/0bBFDTII.ii/KZC/BNkVVfG7Cxq3qQx99wy7kEya');

INSERT INTO polls (id, question, description, category, closed, owner_id) VALUES
  (1, 'Which day works best for the IT Week hackathon?', 'The hackathon runs for one full day.', 'events', FALSE, 1),
  (2, 'What should our study group learn next?', NULL, 'tech', FALSE, 1),
  (3, 'Best merienda near campus?', 'Closed poll kept for reference.', 'food', TRUE, 1);

INSERT INTO poll_options (id, poll_id, text, position) VALUES
  (1, 1, 'Thursday', 1),
  (2, 1, 'Friday', 2),
  (3, 1, 'Saturday', 3),
  (4, 2, 'Docker', 1),
  (5, 2, 'TypeScript', 2),
  (6, 2, 'Data structures', 3),
  (7, 3, 'Turon', 1),
  (8, 3, 'Banana cue', 2),
  (9, 3, 'Siomai rice', 3);

INSERT INTO votes (poll_id, option_id, comment, sentiment, voter_fingerprint) VALUES
  (1, 2, 'Friday is perfect, no classes in the afternoon!', 'POSITIVE', 'voter_sample_1'),
  (1, 2, NULL, NULL, 'voter_sample_2'),
  (1, 3, 'Saturday is fine but I have work sometimes.', 'NEUTRAL', 'voter_sample_3'),
  (2, 5, 'TypeScript would help a lot with our React projects.', 'POSITIVE', 'voter_sample_1'),
  (2, 4, NULL, NULL, 'voter_sample_4'),
  (3, 9, 'Siomai rice never misses.', 'POSITIVE', 'voter_sample_2'),
  (3, 9, NULL, NULL, 'voter_sample_5'),
  (3, 7, 'The turon stall is always out by 3pm, annoying.', 'NEGATIVE', 'voter_sample_6');
