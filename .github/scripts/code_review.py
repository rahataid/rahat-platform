import os
import json
import base64
import requests
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GITHUB_REPO = os.getenv("GITHUB_REPOSITORY")
PR_NUMBER = os.getenv("PR_NUMBER")
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)


def fetch_file_content(file_path):
    """Fetch file content from GitHub."""
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()  # Will raise HTTPError for bad responses (4xx or 5xx)
        content = response.json().get("content")
        if content:
            return base64.b64decode(content).decode("utf-8")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching file {file_path}: {e}")
    except Exception as e:
        print(f"Unexpected error fetching file {file_path}: {e}")
    return None


def analyze_code(file_name, code_content):
    """Send code to OpenAI for review and security checks."""
    try:
        prompt = f"""
        You are an expert software security auditor. Review the following code for security vulnerabilities and suggest improvements:

        File: {file_name}
        ```{code_content}```

        Check for:
        - SQL Injection
        - Hardcoded credentials or secrets
        - Insufficient input validation
        - Cross-site scripting (XSS)
        - Insecure API usage
        - Any other security vulnerabilities

        Provide detailed security recommendations.
        """
        response = client.chat.completions.create(
            model="meta-llama/llama-3.3-70b-instruct:free",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code reviewer and security analyst.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except requests.exceptions.RequestException as e:
        print(f"Error while making API request to OpenAI: {e}")
    except Exception as e:
        print(f"Unexpected error analyzing code in file {file_name}: {e}")
    return "Error analyzing code."


def post_github_comment(pr_number, file_name, feedback):
    """Post AI security feedback on GitHub PR."""
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/issues/{pr_number}/comments"
        comment = {"body": f"### 🛡️ Security Audit for `{file_name}`\n\n{feedback}"}
        response = requests.post(url, headers=HEADERS, json=comment)
        response.raise_for_status()  # Will raise HTTPError for bad responses (4xx or 5xx)
    except requests.exceptions.RequestException as e:
        print(f"Error posting comment on PR {pr_number}: {e}")
    except Exception as e:
        print(f"Unexpected error posting comment on PR {pr_number}: {e}")


def main():
    """Run AI security checks on changed files."""
    try:
        changed_files_env = os.getenv("CHANGED_FILES", "[]")
        cleaned_files_env = changed_files_env.replace('\\"', '"')
        try:
            changed_files = json.loads(cleaned_files_env)
            if not isinstance(changed_files, list):
                raise ValueError("CHANGED_FILES must be a JSON array.")
        except json.JSONDecodeError as e:
            print(f"Error parsing CHANGED_FILES: {changed_files_env}")
            print(f"JSONDecodeError: {e}")
            return

        for file in changed_files:
            # Exclude files in .github/scripts folder and files with specific extensions
            if file.startswith(".github/scripts/"):
                print(f"Skipping file in .github/scripts: {file}")
                continue
                
            if file.endswith((".js", ".ts", ".jsx", ".tsx", ".py", ".sol")):
                content = fetch_file_content(file)
                if content:
                    feedback = analyze_code(file, content)
                    post_github_comment(PR_NUMBER, file, feedback)

    except Exception as e:
        print(f"Unexpected error in main execution: {e}")


if __name__ == "__main__":
    main()