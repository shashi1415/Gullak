from flask import Flask, jsonify, request
from flask_cors import CORS
from db import db
from expenses import expenses_bp
from groq import Groq
from dotenv import load_dotenv
import os


app = Flask(__name__)
CORS(app)
load_dotenv()
app.register_blueprint(expenses_bp, url_prefix='/expenses')

# Initialize Groq client
groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Gullak backend running!"})

@app.route('/test-db')
def test_db():
    doc_ref = db.collection('test').document('sample')
    doc_ref.set({'name': 'Garima', 'status': 'connected'})
    return {"message": "Firebase connected successfully!"}

@app.route("/ai-advice", methods=["POST"])
def ai_advice():
    data = request.get_json()
    user_id = data.get("userId") or data.get("user", {}).get("id")
    user_query = data.get("query") or (data.get("messages", [{}])[-1].get("content") if data.get("messages") else "Hi")

    try:
        # Fetch user's expenses & investments from Firestore
        expenses = []
        investments = []

        if user_id:
            expenses_docs = db.collection("expenses").where("userId", "==", user_id).stream()
            expenses = [doc.to_dict() for doc in expenses_docs]

            investments_docs = db.collection("investments").where("userId", "==", user_id).stream()
            investments = [doc.to_dict() for doc in investments_docs]

        # Build an adaptive prompt for the AI
        prompt = f"""
        You are Gullak — an Indian AI money mentor & portfolio assistant.

        Style:
        - Speak naturally like a friendly human in English or Hinglish (depending on query)
        - Use emojis where appropriate
        - Keep response within 5–8 sentences max
        - Avoid generic greetings like “Namaste Guest”
        - Give short, actionable, realistic financial guidance
        - Be contextual to user's data and query

        User Query: {user_query}
        User ID: {user_id}
        User Expenses Summary: {expenses}
        User Investments Summary: {investments}

        Task:
        - Analyze their query and respond intelligently.
        - If question is about “investment”, give portfolio tips.
        - If question is about “saving”, give saving ideas.
        - If question is about “budget”, give personalized budgeting help.
        - If question is vague, politely ask for clarification.

        Output should feel human, practical, and warm.
        """

        chat_completion = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are Gullak AI, a friendly finance and investment assistant."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
        )

        answer = chat_completion.choices[0].message.content.strip()
        return jsonify({"advice": answer}), 200

    except Exception as e:
        print("AI Error:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route("/groq-influencers", methods=["GET"])
def groq_influencers():
    try:
        prompt = """
        Provide a list of 6 Indian finance/social media influencers.
        Include: name, topic, platform (YouTube/Instagram), and link.
        Return as a JSON array:
        [{"name": "...", "topic": "...", "platform": "...", "link": "..."}]
        """
        response = groq.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful AI giving JSON lists of influencers."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
        )
        import json

        raw = response.choices[0].message.content.strip()
        try:
            influencers = json.loads(raw)
        except json.JSONDecodeError:
            print("Invalid JSON from Groq:", raw)
            # Fallback: return dummy data
            influencers = [
                {"name": "CA Rachana Ranade", "topic": "Investing", "platform": "YouTube", "link": "https://youtube.com/@RachanaRanade"},
                {"name": "Pranjal Kamra", "topic": "Investments", "platform": "YouTube", "link": "https://youtube.com/@PranjalKamra"},
                {"name": "Nitin Bhatia", "topic": "Personal Finance", "platform": "YouTube", "link": "https://youtube.com/@NitinBhatia"},
                {"name": "Ankur Warikoo", "topic": "Entrepreneurship", "platform": "Instagram", "link": "https://instagram.com/warikoo"},
                {"name": "CA Rachana Ranade", "topic": "Investing", "platform": "Instagram", "link": "https://instagram.com/rachana.ranade"},
                {"name": "Invest Yadnya", "topic": "Mutual Funds", "platform": "YouTube", "link": "https://youtube.com/@InvestYadnya"},
            ]
        return jsonify({"influencers": influencers})
    except Exception as e:
        print("Groq influencers error:", e)
        return jsonify({"influencers": [], "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
