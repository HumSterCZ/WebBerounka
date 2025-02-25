import os
import pymysql
from flask import Flask, render_template

app = Flask(__name__)

# Načteme hodnoty z environment proměnných
db_host = os.environ.get("MYSQL_HOST", "mysql")
db_user = os.environ.get("MYSQL_USER", "youruser")
db_password = os.environ.get("MYSQL_PASSWORD", "yourpassword")
db_name = os.environ.get("MYSQL_DATABASE", "berounka_db")

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/test_db')
def test_db():
    try:
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
        connection.close()
        return f"Tabulky v databázi: {tables}"
    except Exception as e:
        return f"Chyba: {e}"