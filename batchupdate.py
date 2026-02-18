import os
import tkinter as tk
from tkinter import filedialog

def update_html_files():
    # --- CONFIGURATION ---
    # The exact string found in your old code
    OLD_MODEL_STRING = "gemini-2.5-flash-preview-09-2025"
    # The new Flash Lite model string
    NEW_MODEL_STRING = "gemini-2.5-flash-lite"
    
    # --- UI SETUP ---
    # Hide the main tkinter window
    root = tk.Tk()
    root.withdraw()

    print("Opening folder selection dialog...")
    print("Please select the folder containing your HTML files.")
    
    # Open the folder picker dialog
    folder_path = filedialog.askdirectory(title="Select Folder containing HTML files")

    if not folder_path:
        print("\nNo folder selected. Operation cancelled.")
        input("Press Enter to exit...")
        return

    print(f"\nTarget Folder: {folder_path}")
    print(f"Replacing: '{OLD_MODEL_STRING}' -> '{NEW_MODEL_STRING}'")
    print("-" * 50)

    # --- PROCESSING ---
    files_updated = 0
    files_scanned = 0
    errors = 0

    # os.walk allows us to go through the folder AND all sub-folders
    for root_dir, dirs, files in os.walk(folder_path):
        for filename in files:
            # We only care about .html or .htm files
            if filename.lower().endswith(('.html', '.htm')):
                files_scanned += 1
                full_path = os.path.join(root_dir, filename)
                
                try:
                    # 1. Read the file content
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # 2. Check if the old model string exists in this file
                    if OLD_MODEL_STRING in content:
                        # 3. Perform the replacement
                        new_content = content.replace(OLD_MODEL_STRING, NEW_MODEL_STRING)
                        
                        # 4. Write the updated content back to the file
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                            
                        print(f"[UPDATED]  {filename}")
                        files_updated += 1
                    else:
                        # Optional: Uncomment below if you want to see files that were skipped
                        # print(f"[SKIPPED]  {filename} (Model string not found)")
                        pass

                except Exception as e:
                    print(f"[ERROR]    Could not process {filename}: {e}")
                    errors += 1

    # --- SUMMARY ---
    print("-" * 50)
    print("PROCESS COMPLETE")
    print(f"Total HTML files scanned: {files_scanned}")
    print(f"Files successfully updated: {files_updated}")
    if errors > 0:
        print(f"Errors encountered:       {errors}")
    print("-" * 50)
    input("Press Enter to close this window...")

if __name__ == "__main__":
    update_html_files()