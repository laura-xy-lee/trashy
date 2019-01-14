from flask import Flask
from flask import render_template

# creates a flask application, named app
app = Flask(__name__)


# a route where we will display the main page, via an html template
@app.route("/")
def homepage():
    return render_template('index.html')


# run the application
if __name__ == "__main__":
    app.run()
