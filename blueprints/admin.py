from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from config import Config
import models
from utils import render_markdown

def create_admin_blueprint():
    """Create admin blueprint with dynamic URL prefix."""
    admin_bp = Blueprint('admin', __name__, url_prefix=f'/admin-{Config.ADMIN_URL_SECRET}')
    
    def login_required(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('admin_logged_in'):
                return redirect(url_for('admin.login'))
            return f(*args, **kwargs)
        return decorated_function
    
    @admin_bp.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            password = request.form.get('password', '')
            if password == Config.ADMIN_PASSWORD:
                session['admin_logged_in'] = True
                return redirect(url_for('admin.dashboard'))
            return render_template('admin/login.html', error='Invalid password')
        return render_template('admin/login.html')
    
    @admin_bp.route('/logout')
    def logout():
        session.pop('admin_logged_in', None)
        return redirect(url_for('admin.login'))
    
    @admin_bp.route('/')
    @login_required
    def dashboard():
        challenges = models.get_all_challenges()
        return render_template('admin/dashboard.html', challenges=challenges)
    
    @admin_bp.route('/challenge/new', methods=['GET', 'POST'])
    @login_required
    def new_challenge():
        if request.method == 'POST':
            data = request.form
            challenge_id = models.create_challenge(
                slug=data['slug'],
                name=data['name'],
                description=data.get('description', ''),
                flag=data['flag'],
                passing_score=int(data.get('passing_score', 0))
            )
            return redirect(url_for('admin.edit_challenge', challenge_id=challenge_id))
        return render_template('admin/challenge_form.html', challenge=None, questions=[])
    
    @admin_bp.route('/challenge/<int:challenge_id>', methods=['GET', 'POST'])
    @login_required
    def edit_challenge(challenge_id):
        challenge = models.get_challenge_by_id(challenge_id)
        if not challenge:
            return redirect(url_for('admin.dashboard'))
        
        if request.method == 'POST':
            data = request.form
            models.update_challenge(
                challenge_id=challenge_id,
                slug=data['slug'],
                name=data['name'],
                description=data.get('description', ''),
                flag=data['flag'],
                passing_score=int(data.get('passing_score', 0)),
                is_active=1 if data.get('is_active') else 0
            )
            challenge = models.get_challenge_by_id(challenge_id)
        
        questions = models.get_questions_by_challenge(challenge_id)
        return render_template('admin/challenge_form.html', challenge=challenge, questions=questions)
    
    @admin_bp.route('/challenge/<int:challenge_id>/delete', methods=['POST'])
    @login_required
    def delete_challenge(challenge_id):
        models.delete_challenge(challenge_id)
        return redirect(url_for('admin.dashboard'))
    
    # Question API endpoints
    @admin_bp.route('/api/challenge/<int:challenge_id>/questions', methods=['GET'])
    @login_required
    def get_questions(challenge_id):
        questions = models.get_questions_by_challenge(challenge_id)
        return jsonify(questions)
    
    @admin_bp.route('/api/challenge/<int:challenge_id>/questions', methods=['POST'])
    @login_required
    def add_question(challenge_id):
        data = request.json
        questions = models.get_questions_by_challenge(challenge_id)
        order_num = len(questions) + 1
        
        question_id = models.create_question(
            challenge_id=challenge_id,
            question=data['question'],
            answer=data['answer'],
            match_type=data.get('match_type', 'exact'),
            order_num=order_num
        )
        return jsonify({'id': question_id, 'order_num': order_num})
    
    @admin_bp.route('/api/questions/<int:question_id>', methods=['PUT'])
    @login_required
    def update_question(question_id):
        data = request.json
        models.update_question(
            question_id=question_id,
            question=data['question'],
            answer=data['answer'],
            match_type=data.get('match_type', 'exact'),
            order_num=data.get('order_num', 0)
        )
        return jsonify({'success': True})
    
    @admin_bp.route('/api/questions/<int:question_id>', methods=['DELETE'])
    @login_required
    def delete_question(question_id):
        models.delete_question(question_id)
        return jsonify({'success': True})
    
    @admin_bp.route('/api/questions/reorder', methods=['POST'])
    @login_required
    def reorder_questions():
        data = request.json
        orders = [(item['id'], item['order_num']) for item in data['orders']]
        models.reorder_questions(orders)
        return jsonify({'success': True})
    
    @admin_bp.route('/api/challenge/<int:challenge_id>/questions/bulk', methods=['POST'])
    @login_required
    def bulk_save_questions(challenge_id):
        """Save all questions at once (create new, update existing, delete removed)."""
        data = request.json
        questions = data.get('questions', [])
        
        # Get existing question IDs
        existing_questions = models.get_questions_by_challenge(challenge_id)
        existing_ids = {q['id'] for q in existing_questions}
        
        # Track which IDs are in the submitted data
        submitted_ids = {q['id'] for q in questions if q['id'] is not None}
        
        # Delete questions that were removed
        ids_to_delete = existing_ids - submitted_ids
        for qid in ids_to_delete:
            models.delete_question(qid)
        
        # Create or update questions
        new_ids = []
        for q in questions:
            if q['id'] is None:
                # Create new question
                new_id = models.create_question(
                    challenge_id=challenge_id,
                    question=q['question'],
                    answer=q['answer'],
                    match_type=q.get('match_type', 'exact'),
                    order_num=q.get('order_num', 0)
                )
                new_ids.append(new_id)
            else:
                # Update existing question
                models.update_question(
                    question_id=q['id'],
                    question=q['question'],
                    answer=q['answer'],
                    match_type=q.get('match_type', 'exact'),
                    order_num=q.get('order_num', 0)
                )
        
        return jsonify({'success': True, 'ids': new_ids})
    
    @admin_bp.route('/api/preview', methods=['POST'])
    @login_required
    def preview_markdown():
        """Render markdown to HTML for preview."""
        data = request.json
        text = data.get('text', '')
        html = render_markdown(text)
        return jsonify({'html': html})
    
    return admin_bp
