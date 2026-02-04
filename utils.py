"""Utility functions for markdown rendering and HTML sanitization."""

import markdown
import bleach

# Allowed HTML tags for sanitization
ALLOWED_TAGS = [
    'a', 'abbr', 'acronym', 'b', 'blockquote', 'br', 'code', 'div', 'em',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p',
    'pre', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
]

# Allowed HTML attributes
ALLOWED_ATTRIBUTES = {
    '*': ['class', 'id'],
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'abbr': ['title'],
    'acronym': ['title'],
}

# Markdown extensions to enable
MD_EXTENSIONS = [
    'fenced_code',      # ```code blocks```
    'tables',           # | tables |
    'nl2br',            # newlines to <br>
    'sane_lists',       # better list handling
    'codehilite',       # code syntax highlighting
]


def render_markdown(text):
    """
    Convert markdown text to sanitized HTML.
    
    Args:
        text: Raw markdown string
        
    Returns:
        Sanitized HTML string
    """
    if not text:
        return ''
    
    # Convert markdown to HTML
    md = markdown.Markdown(extensions=MD_EXTENSIONS)
    html = md.convert(text)
    
    # Sanitize HTML to prevent XSS
    clean_html = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
    
    # Fix links to open in new tab
    clean_html = bleach.linkify(
        clean_html,
        callbacks=[lambda attrs, new: {**attrs, (None, 'target'): '_blank', (None, 'rel'): 'noopener noreferrer'}],
        skip_tags=['pre', 'code']
    )
    
    return clean_html
