from flask import Flask, jsonify, request, send_from_directory
import os
import json
import requests
from urllib.parse import urlencode

# Define the base directory for the project
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Create the Flask app and set the static folder
app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'frontend/static'))

# Load the schema once on startup
SCHEMA_PATH = os.path.join(BASE_DIR, 'frontend/disease_trial_schema.json')
with open(SCHEMA_PATH, 'r') as schema_file:
    SCHEMA = json.load(schema_file)

# Serve the index.html from the 'frontend' folder
@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(BASE_DIR, 'frontend'), 'index.html')

# Serve the JSON schema
@app.route('/get-schema', methods=['GET'])
def get_schema():
    return jsonify(SCHEMA)

# Handle form submission
@app.route('/query-clinical-trials', methods=['POST'])
def query_clinical_trials():
    try:
        # Parse input data
        data = request.json
        if not data:
            raise ValueError("Invalid or missing JSON payload")

        # Initialize query terms
        query_terms = []
        print("Raw Input Data:", data)  # Debugging log

        # Add condition (search area: cond)
        condition = data.get("condition", "").strip()
        if condition:
            query_terms.append(f'cond:"{condition}"')

        # Add study phase (search area: phase)
        phase = data.get("phase", "").strip()
        if phase:
            query_terms.append(f'phase:"{phase}"')

        # Add location (search area: loc)
        location = data.get("location", "").strip()
        if location:
            query_terms.append(f'loc:"{location}"')

        # Add age range (search area: age)
        age = data.get("age", "").strip()
        if age:
            query_terms.append(f'age:{age}')

        # Add gender (search area: gender)
        gender = data.get("gender", "").strip()
        if gender:
            query_terms.append(f'gender:{gender}')

        # Combine query terms using AND
        query_cond = " AND ".join(query_terms)
        print("Query Terms:", query_terms)  # Debugging log
        print("Query Condition:", query_cond)  # Debugging log

        # Construct API query parameters
        base_url = "https://clinicaltrials.gov/api/v2/studies"
        query_params = {
            "query.cond": query_cond,
            "fields": ",".join([
                "protocolSection.identificationModule.nctId",
                "protocolSection.identificationModule.briefTitle",
                "protocolSection.conditionsModule.conditions",
                "protocolSection.descriptionModule.briefSummary",
                "protocolSection.designModule.phases"
            ]),
            "pageSize": 10
        }

        # Remove empty parameters
        query_params = {k: v for k, v in query_params.items() if v}

        # Construct final API URL
        url = f"{base_url}?{urlencode(query_params)}"
        print("Final API URL:", url)  # Debugging log

        # Make the API request
        response = requests.get(url, headers={"Accept": "application/json"})
        if response.status_code != 200:
            print("API Response Text:", response.text)  # Log detailed error
            raise Exception(f"ClinicalTrials.gov API error: {response.status_code}")

        # Parse the API response
        api_data = response.json()
        studies = api_data.get("studies", [])

        # Process the results into a simplified structure
        recommendations = [
            {
                "id": study.get("protocolSection", {}).get("identificationModule", {}).get("nctId", "N/A"),
                "title": study.get("protocolSection", {}).get("identificationModule", {}).get("briefTitle", "No Title"),
                "condition": ", ".join(study.get("protocolSection", {}).get("conditionsModule", {}).get("conditions", [])),
                "phase": ", ".join(study.get("protocolSection", {}).get("designModule", {}).get("phaseList", [])),
                "summary": study.get("protocolSection", {}).get("descriptionModule", {}).get("briefSummary", "No Summary")
            }
            for study in studies
        ]

        return jsonify({"status": "success", "results": recommendations})

    except Exception as e:
        print("Error in /query-clinical-trials:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
