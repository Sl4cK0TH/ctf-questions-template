import sqlite3
from datetime import datetime
from config import Config

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with tables."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create challenges table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            flag TEXT NOT NULL,
            passing_score INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create questions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER NOT NULL,
            order_num INTEGER DEFAULT 0,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            match_type TEXT DEFAULT 'exact',
            FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

# Challenge CRUD operations
def get_all_challenges(active_only=False):
    conn = get_db()
    cursor = conn.cursor()
    if active_only:
        cursor.execute('SELECT * FROM challenges WHERE is_active = 1 ORDER BY created_at DESC')
    else:
        cursor.execute('SELECT * FROM challenges ORDER BY created_at DESC')
    challenges = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return challenges

def get_challenge_by_slug(slug):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM challenges WHERE slug = ?', (slug,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_challenge_by_id(challenge_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM challenges WHERE id = ?', (challenge_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_challenge(slug, name, description, flag, passing_score=0):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO challenges (slug, name, description, flag, passing_score)
        VALUES (?, ?, ?, ?, ?)
    ''', (slug, name, description, flag, passing_score))
    challenge_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return challenge_id

def update_challenge(challenge_id, slug, name, description, flag, passing_score, is_active):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE challenges 
        SET slug = ?, name = ?, description = ?, flag = ?, passing_score = ?, is_active = ?
        WHERE id = ?
    ''', (slug, name, description, flag, passing_score, is_active, challenge_id))
    conn.commit()
    conn.close()

def delete_challenge(challenge_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM challenges WHERE id = ?', (challenge_id,))
    conn.commit()
    conn.close()

# Question CRUD operations
def get_questions_by_challenge(challenge_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM questions WHERE challenge_id = ? ORDER BY order_num', (challenge_id,))
    questions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return questions

def create_question(challenge_id, question, answer, match_type='exact', order_num=0):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO questions (challenge_id, question, answer, match_type, order_num)
        VALUES (?, ?, ?, ?, ?)
    ''', (challenge_id, question, answer, match_type, order_num))
    question_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return question_id

def update_question(question_id, question, answer, match_type, order_num):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE questions 
        SET question = ?, answer = ?, match_type = ?, order_num = ?
        WHERE id = ?
    ''', (question, answer, match_type, order_num, question_id))
    conn.commit()
    conn.close()

def delete_question(question_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM questions WHERE id = ?', (question_id,))
    conn.commit()
    conn.close()

def reorder_questions(question_orders):
    """Update order of multiple questions. question_orders is list of (id, order_num) tuples."""
    conn = get_db()
    cursor = conn.cursor()
    for q_id, order_num in question_orders:
        cursor.execute('UPDATE questions SET order_num = ? WHERE id = ?', (order_num, q_id))
    conn.commit()
    conn.close()
