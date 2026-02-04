from flask import Blueprint, render_template, request, jsonify
from markupsafe import Markup
import models
import re
from utils import render_markdown

participant_bp = Blueprint('participant', __name__)

def strip_html_tags(text):
    """Remove HTML tags and markdown formatting for plain text preview."""
    if not text:
        return ''
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Remove markdown formatting
    clean = re.sub(r'\*\*(.+?)\*\*', r'\1', clean)  # bold
    clean = re.sub(r'\*(.+?)\*', r'\1', clean)      # italic
    clean = re.sub(r'`(.+?)`', r'\1', clean)        # code
    clean = re.sub(r'#{1,6}\s*', '', clean)         # headers
    clean = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', clean)  # links
    # Collapse whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

@participant_bp.route('/')
def index():
    """List all active challenges."""
    challenges = models.get_all_challenges(active_only=True)
    # Add plain text preview for cards
    for c in challenges:
        c['description_preview'] = strip_html_tags(c.get('description', ''))
    return render_template('participant/index.html', challenges=challenges)

@participant_bp.route('/c/<slug>')
def challenge(slug):
    """Display challenge page."""
    challenge = models.get_challenge_by_slug(slug)
    if not challenge or not challenge['is_active']:
        return render_template('participant/index.html', 
                             challenges=models.get_all_challenges(active_only=True),
                             error='Challenge not found')
    
    questions = models.get_questions_by_challenge(challenge['id'])
    # Render markdown for questions and mark as safe HTML
    safe_questions = [{
        'id': q['id'], 
        'order_num': q['order_num'], 
        'question': Markup(render_markdown(q['question']))
    } for q in questions]
    
    # Render markdown for challenge description
    challenge_data = dict(challenge)
    if challenge_data.get('description'):
        challenge_data['description_html'] = Markup(render_markdown(challenge_data['description']))
    else:
        challenge_data['description_html'] = 'You have been assigned to investigate this challenge.'
    
    return render_template('participant/challenge.html', 
                         challenge=challenge_data, 
                         questions=safe_questions)

@participant_bp.route('/api/c/<slug>/check', methods=['POST'])
def check_answers(slug):
    """Verify submitted answers."""
    challenge = models.get_challenge_by_slug(slug)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404
    
    data = request.json
    user_answers = data.get('answers', {})
    
    questions = models.get_questions_by_challenge(challenge['id'])
    
    results = {}
    correct_count = 0
    
    for q in questions:
        q_id = str(q['id'])
        user_input = user_answers.get(q_id, '').strip()
        correct_answer = q['answer']
        match_type = q['match_type']
        
        # Check answer based on match type
        if match_type == 'exact':
            is_correct = (user_input == correct_answer)
        elif match_type == 'case_insensitive':
            is_correct = (user_input.lower() == correct_answer.lower())
        elif match_type == 'contains':
            is_correct = (correct_answer.lower() in user_input.lower())
        else:
            is_correct = (user_input == correct_answer)
        
        results[q_id] = is_correct
        if is_correct:
            correct_count += 1
    
    total_questions = len(questions)
    passing_score = challenge['passing_score']
    
    # If passing_score is 0, all questions must be correct
    if passing_score == 0:
        passing_score = total_questions
    
    passed = (correct_count >= passing_score)
    
    response = {
        'results': results,
        'passed': passed,
        'score': correct_count,
        'total': total_questions,
        'required': passing_score
    }
    
    if passed:
        response['flag'] = challenge['flag']
    
    return jsonify(response)
