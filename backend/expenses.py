from flask import Blueprint, request, jsonify
from db import db

expenses_bp = Blueprint('expenses', __name__)

# 🟢 Create expense
@expenses_bp.route('/add', methods=['POST'])
def add_expense():
    data = request.get_json()
    if not data or 'amount' not in data or 'category' not in data:
        return jsonify({"error": "Invalid data"}), 400

    expense_ref = db.collection('expenses').document()
    expense_ref.set({
        'amount': data['amount'],
        'category': data['category'],
        'note': data.get('note', ''),
        'timestamp': data.get('timestamp')
    })
    return jsonify({"message": "Expense added successfully!"}), 200

# 🟡 Get all expenses
@expenses_bp.route('/all', methods=['GET'])
def get_expenses():
    expenses = []
    docs = db.collection('expenses').stream()
    for doc in docs:
        expense = doc.to_dict()
        expense['id'] = doc.id
        expenses.append(expense)
    return jsonify(expenses), 200

# 🔴 Delete expense
@expenses_bp.route('/delete/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    db.collection('expenses').document(expense_id).delete()
    return jsonify({"message": "Expense deleted successfully!"}), 200
