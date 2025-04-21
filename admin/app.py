from flask import Flask, jsonify, request
from google_sheets import fetch_final_scores, get_nomination_leaders, get_participants, get_nominations, get_blocks
import os

app = Flask(__name__)

# Конфигурация
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
ADMIN_IDS = [int(id) for id in os.environ.get('ADMIN_IDS', '').split(',') if id]

def is_admin(user_id):
    return user_id in ADMIN_IDS

@app.route('/api/filters')
def get_filters():
    try:
        nominations = get_nominations()
        blocks = get_blocks()
        return jsonify({
            'nominations': nominations,
            'blocks': blocks
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scores')
def get_scores():
    user_id = request.args.get('user_id')
    if not user_id or not is_admin(int(user_id)):
        return jsonify({'error': 'Unauthorized'}), 403
        
    nomination = request.args.get('nomination')
    block = request.args.get('block')
    
    try:
        scores = fetch_final_scores(nomination, block)
        return jsonify({'scores': scores})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leaders')
def get_leaders():
    user_id = request.args.get('user_id')
    if not user_id or not is_admin(int(user_id)):
        return jsonify({'error': 'Unauthorized'}), 403
        
    nomination = request.args.get('nomination')
    limit = int(request.args.get('limit', 5))
    
    try:
        leaders = get_nomination_leaders(nomination, limit)
        return jsonify({'leaders': leaders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/participants')
def get_participants_list():
    user_id = request.args.get('user_id')
    if not user_id or not is_admin(int(user_id)):
        return jsonify({'error': 'Unauthorized'}), 403
        
    block = request.args.get('block')
    
    try:
        participants = get_participants(block)
        return jsonify({'participants': participants})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 