
import os
from datetime import datetime
from pathlib import Path
from typing import List, Set

# Add configuration files to include
TOP_LEVEL_FILES = ["tsconfig.json", "tailwind.config.ts", "next.config.mjs", "package.json", ".eslintrc.json", "README.md", "middleware.ts"]
INCLUDE_DIRS = ["app"] # "app/api/conversation", "app/api/conversations", 
# INCLUDE_DIRS = ["app/utils", "app/lib", "public/config", "app/review"] # "app/api/conversation", "app/api/conversations", 

def get_project_info() -> str:
    current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"""
# Project Information
Generated on: {current_datetime}

About: This document contains the NextJS project structure and source code files.
It provides a snapshot of the project's implementation and structure at the time
of generation.

## Project Context
- The application is built by Roostr AI, a company specializing in AI-powered solutions for logistics.
- This project is a frontend application for an AI-powered rate management system for freight forwarders.
- The backend uses AI agents to talk with partner agents over emails to get rate information.
- The frontend provides a way to review, edit, approve, and reject the rate information received.
- It will also provide a way to configure the AI agents (digital workers) behavior. 

## Project Structure:
- This is a NextJS 14 project using the App Router
- Key directories processed:
  - app/api: Backend API routes
  - app/review: Frontend review interface components
- We use a service called "Wristband" for authentication, we should not need to modify authentication code. 

## Here are the environment variables we use:
- NEXT_PUBLIC_API_URL
- GOOGLE_CLIENT_EMAIL
- GOOGLE_PRIVATE_KEY
- SSOT_SHEET_ID
- NEXT_PUBLIC_SKIP_AUTH
- WRISTBAND_CLIENT_ID
- WRISTBAND_CLIENT_SECRET
- WRISTBAND_APP_DOMAIN
- NEXT_PUBLIC_APP_URL
- SESSION_SECRET
- WRISTBAND_LOGIN_SECRET
- METRIC_SHEET_ID
- MONGO_URI
- MONGO_DB

## Additional Notes:
- We're using typescript and tailwindcss in this project.
- At the top of each file, you will see a comment with the file name and location. It's important to make sure this comment is present in all files.
- User experience is important: use attractive and consistent styling. 
- If we are restructuring and no longer need a certain file, please call it out to be removed.
- It's best to keep files short, under 300 lines of code if possible. If a file is getting too long, consider breaking it up into smaller files.
- IMPORTANT: if you are making updates to an existing script to add a new feature, please make sure you are not breaking any existing functionality. Make only the minimal changes necessary to add the new feature.

## Meaning of the tabs in the /review page:
- Pending: These are the rates that need to be reviewed. They show the rates in the staging_rates.json. 
- Valid: These are the rates which have been accepted by the user, but have not expired yet. These rates come from accepted_rates.json.
- Expired: These are the rates which have been accepted by the user, but have expired. These rates come from accepted_rates.json.
- Rejected: These are the rates which have been rejected by the user. They are all the rates in the rejected_rates.json file.
"""

def get_top_level_files(base_path: Path) -> str:
    content = []
    content.append("# Top Level Configuration Files\n")
    
    for file_name in TOP_LEVEL_FILES:
        file_path = base_path / file_name
        if file_path.exists():
            file_content = get_file_contents(file_path)
            content.append(file_content)
        else:
            content.append(f"## {file_name}\n\nFile not found.\n")
            
    return "\n".join(content)

def list_directory_structure(base_path: Path, max_depth: int = 5) -> str:
    if not base_path.exists():
        return ""
        
    structure_lines = []
    structure_lines.append(base_path.name)
    
    def recurse(path: Path, prefix: str = "", depth: int = 0):
        if depth > max_depth:
            return
        try:
            items = [p for p in path.iterdir() if not p.name.startswith('.')]
            items = sorted(items, key=lambda p: (p.is_file(), p.name))
        except Exception as e:
            print(f"Error accessing {path}: {e}")
            return
            
        for i, item in enumerate(items):
            is_last = i == len(items) - 1
            connector = "└── " if is_last else "├── "
            line = prefix + connector + item.name
            structure_lines.append(line)
            
            if item.is_dir():
                new_prefix = prefix + ("    " if is_last else "│   ")
                recurse(item, new_prefix, depth + 1)
                
    recurse(base_path)
    return "\n".join(structure_lines)

def get_file_contents(file_path: Path, max_lines: int = 600) -> str:
    ext = file_path.suffix
    lang_map = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".mjs": "javascript",
        ".js": "javascript",
        ".json": "json",
        ".css": "css",
        ".md": "markdown",
        ".d.ts": "typescript"
    }
    lang = lang_map.get(ext.lower(), "")
    
    try:
        with file_path.open('r', encoding='utf-8') as f:
            lines = f.readlines()
            if len(lines) > max_lines:
                content = "".join(lines[:max_lines])
                content += f"\n\n... (truncated, {len(lines) - max_lines} more lines)"
            else:
                content = "".join(lines)
                
        relative_path = file_path.relative_to(file_path.parents[1])
        return f"## {file_path.name}\n\nLocation: {relative_path}\n\n```{lang}\n{content}\n```\n"
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return f"## {file_path.name}\n\nError reading file: {e}\n\n"

def process_directory(base_path: Path, relative_dir: str) -> str:
    target_path = base_path / relative_dir
    if not target_path.exists():
        return f"# Directory {relative_dir}\n\nDirectory does not exist.\n"
        
    files_content = []
    for root, _, files in os.walk(target_path):
        root_path = Path(root)
        for file in files:
            file_path = root_path / file
            # Include json files along with typescript, javascript files
            if file_path.suffix in ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']:
                content = get_file_contents(file_path)
                files_content.append(content)
                
    return f"# Directory: {relative_dir}\n\n" + "\n".join(files_content)

def main():
    frontend_path = Path.cwd()
    app_path = frontend_path / "app"
    output_file = frontend_path / "AI.md"
    
    content = [
        get_project_info(),
        
        # Add top-level configuration files
        get_top_level_files(frontend_path),
        
        "# Directory Structure\n\n```\n" + 
        list_directory_structure(app_path, max_depth=5) +
        "\n```\n"
    ]
    
    # Add each included directory's contents
    for dir_path in INCLUDE_DIRS:
        content.append(process_directory(frontend_path, dir_path))
    
    try:
        with output_file.open("w", encoding="utf-8") as f:
            f.write("\n\n".join(content))
        print("✅ AI.md has been generated successfully.\n")
    except Exception as e:
        print(f"Error writing to output file: {e}")

if __name__ == "__main__":
    print("Running script to generate AI.md")
    main()
