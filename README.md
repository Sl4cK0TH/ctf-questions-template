# CTF Analysis Template

> **A reusable CTF forensics challenge platform with admin dashboard**
>
> Made by **Zor0ark** / **Sl4cK0TH**

---

## 📋 Overview

CTF Analysis Template is a Flask-based web application designed for hosting Capture The Flag (CTF) forensic analysis challenges. It provides a complete solution for CTF organizers to create, manage, and deploy multiple challenges with a sleek, professional interface.

### ✨ Features

| Feature | Description |
|---------|-------------|
| **Multi-Challenge Support** | Host unlimited challenges in a single instance |
| **Hidden Admin Panel** | Secret URL + password protection for security |
| **3 Answer Match Types** | Exact, case-insensitive, or contains matching |
| **Configurable Passing Score** | Set required correct answers (0 = all required) |
| **SQLite Database** | Portable, single-file database storage |
| **Docker Ready** | Production-ready Docker configuration |
| **Custom Theme** | Dark theme with lime green accents (#a3ea2a) |
| **Tutorial System** | Built-in walkthrough for participants |

### 🗂️ Repository Structure

```
ctf-analysis-template/
├── app.py                 # Main Flask application
├── config.py              # Environment configuration
├── models.py              # SQLite database models
├── blueprints/
│   ├── __init__.py
│   ├── admin.py           # Admin routes & authentication
│   └── participant.py     # Participant challenge routes
├── templates/
│   ├── admin/
│   │   ├── login.html     # Admin login page
│   │   ├── dashboard.html # Challenge management
│   │   └── challenge_form.html # Challenge/question editor
│   └── participant/
│       ├── index.html     # Challenge selection
│       └── challenge.html # Challenge interface
├── static/
│   ├── css/
│   │   └── style.css      # Theme styling
│   └── js/
│       ├── admin.js       # Admin functionality
│       └── participant.js # Challenge logic & tutorial
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Docker deployment
├── requirements.txt       # Python dependencies
├── .env.example           # Environment template
└── README.md              # This file
```

---

## 🚀 Installation

### Prerequisites

- Python 3.9+ or Docker
- Git (optional)

### Option 1: Local Development

```bash
# 1. Navigate to the template directory
cd ctf-analysis-template

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings

# 5. Run the application
python app.py
```

The app will be available at `http://localhost:5000`

### Option 2: Docker Deployment

```bash
# 1. Navigate to the template directory
cd ctf-analysis-template

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## ⚙️ Configuration

Edit `.env` file with your settings:

```env
# Flask secret key (generate a random one for production)
SECRET_KEY=your-super-secret-key-change-me

# Admin password for dashboard access
ADMIN_PASSWORD=your-strong-password

# Secret URL prefix for admin (e.g., /admin-7x9k2m/)
ADMIN_URL_SECRET=your-random-string

# Database file path
DATABASE_PATH=database.db
```

> ⚠️ **Security Note**: Always change default passwords and secrets before deploying!

---

## 📖 Usage

### Admin Dashboard

1. Navigate to `http://localhost:5000/admin-{YOUR_SECRET}/`
2. Login with your `ADMIN_PASSWORD`
3. Create challenges, add questions, set flags
4. Toggle challenges active/inactive

### Participant View

- **Challenge List**: `http://localhost:5000/`
- **Individual Challenge**: `http://localhost:5000/c/{challenge-slug}`

### Answer Match Types

| Type | Description |
|------|-------------|
| `exact` | Answer must match exactly (case-sensitive) |
| `case_insensitive` | Answer matches ignoring case |
| `contains` | Correct answer must be contained in user input |

---

## 🎨 Theme Customization

The theme uses CSS custom properties in `static/css/style.css`:

```css
:root {
    --bg-dark: #151c2b;
    --panel-bg: #1e2536;
    --accent: #a3ea2a;
    --success: #8aff7c;
    --error: #ef4444;
}
```

---

## 📝 License

This project is open source and free to use for CTF events.

---

**Made with 💚 by Zor0ark / Sl4cK0TH**
