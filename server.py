from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from duckduckgo_search import DDGS
import json
import re

app = Flask(__name__)
CORS(app)

def configure_gemini(api_key):
    genai.configure(api_key=api_key)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    api_key = data.get('api_key', '')

    if not api_key:
        return jsonify({'error': 'No API Key provided.'}), 400

    try:
        configure_gemini(api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        prompt = f"""
        You are ScholarAI, a helpful college assistant. 
        A student says: "{message}"
        
        Analyze what they said. If they have provided enough information to build a profile (like GPA, major, or background, or if they explicitly said they uploaded a resume and want scholarships), respond encouragingly and set "is_profile_complete" to true.
        If they just said hello or need help, answer their question normally and set "is_profile_complete" to false.
        
        Output your response strictly as a JSON object:
        {{
            "reply": "Your response to the student here.",
            "is_profile_complete": true or false
        }}
        """
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Clean markdown formatting if present
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search_scholarships', methods=['POST'])
def search_scholarships():
    data = request.json
    profile = data.get('profile', '')
    api_key = data.get('api_key', '')

    if not api_key:
        return jsonify({'error': 'No API Key provided.'}), 400

    try:
        configure_gemini(api_key)
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # 1. Ask Gemini to generate search queries based on the profile
        query_prompt = f"Based on this student profile: '{profile}', generate 3 specific DuckDuckGo search queries to find active non-essay scholarships. Return ONLY a comma-separated list of the 3 queries."
        query_response = model.generate_content(query_prompt)
        queries = [q.strip() for q in query_response.text.split(',')]
        
        # 2. Use DuckDuckGo to search the web
        ddgs = DDGS()
        search_results = []
        for q in queries[:3]:
            try:
                results = ddgs.text(q + " non essay apply", max_results=15)
                for r in results:
                    search_results.append(f"Title: {r.get('title')}\nSnippet: {r.get('body')}\nLink: {r.get('href')}")
            except Exception:
                continue
                
        context = "\n\n".join(search_results)
        
        # 3. Ask Gemini to extract and supplement to reach a large list (user requested ~100, we'll aim for 50-100 to avoid timeout)
        extraction_prompt = f"""
        You are a scholarship finder. Based on the student profile: "{profile}"
        And based on these REAL web search results:
        {context}
        
        Create a list of active, real scholarships. Extract as many as you can from the search results, and supplement with other real, known scholarships matching the profile from your knowledge base to get as close to 50-100 as possible.
        
        Return the data STRICTLY as a JSON array of objects with these keys: name, category, deadline, amount, link.
        Ensure every link is a real, absolute URL (starting with http).
        
        Example:
        [
            {{"name": "Women in Tech Fund", "category": "STEM", "deadline": "Dec 31, 2026", "amount": "$5,000", "link": "https://example.com/apply"}}
        ]
        
        ONLY output the JSON array, nothing else.
        """
        
        # Set a higher timeout/token limit if possible
        response = model.generate_content(extraction_prompt, generation_config={"max_output_tokens": 8192})
        text = response.text
        
        text = text.replace("```json", "").replace("```", "").strip()
        # Find the first [ and last ] to safely parse
        start_idx = text.find('[')
        end_idx = text.rfind(']') + 1
        json_str = text[start_idx:end_idx]
        
        scholarships = json.loads(json_str)
        
        return jsonify({'scholarships': scholarships})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
