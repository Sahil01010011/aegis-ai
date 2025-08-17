# app.py
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
import requests
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer

load_dotenv()

# --- App Initialization (FIXED) ---
# This explicitly tells Flask where to find your templates, fixing the error.
# --- App Initialization (FIXED & ROBUST) ---
# This creates an absolute path to your templates folder, which is foolproof.
BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, template_folder=BASE_DIR / 'templates', static_folder=BASE_DIR / 'static')

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a-very-secret-key-for-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000')

# --- Database Model ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- AegisAPI Class ---
class AegisAPI:
    @staticmethod
    def health_check():
        try:
            response = requests.get(f"{API_BASE_URL}/health", timeout=5)
            return response.status_code == 200
        except:
            return False

# --- Authentication Routes ---
@app.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        identifier = request.form.get('identifier')
        password = request.form.get('password')
        user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user, remember=True)
            return redirect(url_for('dashboard'))
        else:
            flash('Login failed. Please check your credentials.', 'danger')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        user_by_username = User.query.filter_by(username=username).first()
        if user_by_username:
            flash('Username already exists. Please choose another.', 'warning')
            return redirect(url_for('signup'))
        user_by_email = User.query.filter_by(email=email).first()
        if user_by_email:
            flash('Email address is already registered.', 'warning')
            return redirect(url_for('signup'))
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        if user:
            token = serializer.dumps(email, salt='password-reset-salt')
            reset_url = url_for('reset_password', token=token, _external=True)
            print(f"--- SIMULATED EMAIL TO: {email} ---")
            print(f"Reset Link: {reset_url}")
            print(f"---------------------------------")
            flash('Password reset instructions have been (simulated) sent to your email.', 'info')
        else:
            flash('No account found with that email address.', 'warning')
        return redirect(url_for('forgot_password'))
    return render_template('forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)
    except:
        flash('The password reset link is invalid or has expired.', 'danger')
        return redirect(url_for('forgot_password'))
    if request.method == 'POST':
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user:
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            user.password = hashed_password
            db.session.commit()
            flash('Your password has been updated! You can now log in.', 'success')
            return redirect(url_for('login'))
    return render_template('reset_password.html', token=token)

# --- Social Auth Routes (Placeholders) ---
@app.route('/login/google')
def login_google():
    flash('Google login is not yet implemented.', 'info')
    return redirect(url_for('login'))

@app.route('/login/github')
def login_github():
    flash('GitHub login is not yet implemented.', 'info')
    return redirect(url_for('login'))

# --- Protected Application Routes (RESTORED) ---
@app.route('/dashboard')
@login_required
def dashboard():
    """Renders the main Threat Intelligence dashboard page."""
    api_healthy = AegisAPI.health_check()
    current_time = datetime.now().strftime('%H:%M:%S')
    return render_template('dashboard.html', 
                           api_healthy=api_healthy,
                           api_base_url=API_BASE_URL,
                           current_time=current_time,
                           user_id=current_user.id
                           )                     

@app.route('/dlp-rules')
@login_required
def dlp_rules():
    """Renders the DLP Rule Editor page."""
    api_healthy = AegisAPI.health_check()
    current_time = datetime.now().strftime('%H:%M:%S')
    return render_template('dlp_rules.html',
                           api_healthy=api_healthy,
                           api_base_url=API_BASE_URL,
                           current_time=current_time)

# ▼▼▼ PASTE THE NEW PROFILE ROUTE HERE ▼▼▼
@app.route('/profile')
@login_required
def profile():
    """Renders the user's profile page."""
    return render_template('profile.html')
# ▲▲▲ END OF NEW PROFILE ROUTE ▲▲▲

@app.route('/integrations')
@login_required
def integrations():
    """Renders the new Integrations page."""
    return render_template('integrations.html')

@app.route('/settings')
@login_required
def settings():
    """Renders the Settings page."""
    return render_template('settings.html')

@app.route('/activity-log')
@login_required
def activity_log():
    """Renders the Activity Log page."""
    return render_template('activity_log.html')

# --- API Endpoints (RESTORED) ---
@app.route('/analyze', methods=['POST'])
@login_required
def analyze():
    """Handles analysis requests from the dashboard's JavaScript."""
    try:
        data = request.get_json()
        text = data.get('text', '')
        profile = data.get('security_profile', 'balanced')
        conversation_history = data.get('conversation_history', [])
        
        endpoint = f"{API_BASE_URL}/analyze"
        if profile == 'fast': endpoint = f"{API_BASE_URL}/analyze/fast"
        elif profile == 'paranoid': endpoint = f"{API_BASE_URL}/analyze/paranoid"
        
        response = requests.post(endpoint, json=data, timeout=15)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test-patterns')
@login_required
def test_patterns():
    """Handles test pattern requests from the dashboard's JavaScript."""
    try:
        response = requests.get(f"{API_BASE_URL}/test-patterns", timeout=20)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api-status')
@login_required
def api_status():
    """Handles health check requests from the dashboard's JavaScript."""
    healthy = AegisAPI.health_check()
    return jsonify({'healthy': healthy})

@app.route('/integrations/slack', methods=['GET'])
@login_required
def get_slack_config():
    """Proxies the request to get Slack config from the Aegis backend."""
    try:
        response = requests.get(f"{API_BASE_URL}/integrations/slack", timeout=5)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/integrations/slack', methods=['POST'])
@login_required
def post_slack_config():
    """Proxies the request to save Slack config to the Aegis backend."""
    try:
        data = request.get_json()
        response = requests.post(f"{API_BASE_URL}/integrations/slack", json=data, timeout=10)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/config', methods=['GET'])
@login_required
def get_aegis_config():
    """Proxies the request to get the full config from the Aegis backend."""
    try:
        response = requests.get(f"{API_BASE_URL}/config", timeout=5)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/config/weights', methods=['PUT'])
@login_required
def update_aegis_weights():
    """Proxies the request to update threat weights on the Aegis backend."""
    try:
        data = request.get_json()
        response = requests.put(f"{API_BASE_URL}/config/weights", json=data, timeout=10)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/config/thresholds', methods=['PUT'])
@login_required
def update_aegis_thresholds():
    """Proxies the request to update detection thresholds on the Aegis backend."""
    try:
        data = request.get_json()
        response = requests.put(f"{API_BASE_URL}/config/thresholds", json=data, timeout=10)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

    
@app.route('/user/<user_id>/role', methods=['GET', 'PUT'])
@login_required
def user_role_proxy(user_id):
    """Proxies requests for user role to the Aegis backend."""
    try:
        if request.method == 'GET':
            response = requests.get(f"{API_BASE_URL}/user/{user_id}/role", timeout=5)
        elif request.method == 'PUT':
            data = request.get_json()
            response = requests.put(f"{API_BASE_URL}/user/{user_id}/role", json=data, timeout=10)
        
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
@login_required
def get_aegis_stats():
    """Proxies the request to get dashboard stats from the Aegis backend."""
    try:
        response = requests.get(f"{API_BASE_URL}/stats", timeout=5)
        response.raise_for_status()
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/logs', methods=['GET'])
@login_required
def get_aegis_logs():
    """Proxies the request to get logs from the Aegis backend."""
    try:
        response = requests.get(f"{API_BASE_URL}/logs", timeout=5)
        response.raise_for_status() # This ensures errors from the backend are caught
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print("🛡️  Aegis AI Sentry - Now with Professional Auth")
    app.run(debug=True, host='0.0.0.0', port=5000)
