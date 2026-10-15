from flask import Flask, jsonify
from flask_cors import CORS
from database import engine, Base
from routes.auth import auth_bp
from routes.routing import route_bp

# Create database tables
Base.metadata.create_all(bind=engine)

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(route_bp)

@app.route("/")
def read_root():
    return jsonify({"message": "Welcome to Safe Route AI API"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
