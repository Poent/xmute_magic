# xmute_magic

## Local Development Setup

Create an isolated Python environment so dependencies stay local to your machine.

1. Ensure you have Python 3.10 or newer installed (the project has been run with Python 3.13).
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
   - Windows (PowerShell):
     ```powershell
     .venv\\Scripts\\Activate.ps1
     ```
4. Install project dependencies inside the activated environment:
   ```bash
   pip install -r requirements.txt
   ```
   If a requirements file is not available, install the needed packages manually (e.g., `Flask`, `requests`, and `authlib`).
5. Once the environment is active and dependencies are installed, you can run the application:
   ```bash
   flask --app app run
   ```

Deactivate the environment at any time with `deactivate`.
