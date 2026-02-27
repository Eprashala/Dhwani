import os
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
from bs4 import BeautifulSoup
import shutil

class EprashalaObfuscator:
    def __init__(self, root):
        self.root = root
        self.root.title("Eprashala LMS - Multi-File Obfuscator")
        self.root.geometry("6000x500")

        # UI Setup
        tk.Label(root, text="Eprashala Logic Protection Tool", font=("Arial", 14, "bold"), fg="#FF9800").pack(pady=10)
        
        # Folder Selection
        frame = tk.Frame(root)
        frame.pack(pady=10, padx=20, fill='x')
        
        self.path_var = tk.StringVar()
        tk.Entry(frame, textvariable=self.path_var, state='readonly').pack(side='left', expand=True, fill='x', padx=5)
        tk.Button(frame, text="Browse Folder", command=self.browse).pack(side='right')

        # Log Area
        self.log = scrolledtext.ScrolledText(root, height=15, font=("Consolas", 9))
        self.log.pack(pady=10, padx=20, fill='both', expand=True)

        # Corrected Action Button (Using 'fg' instead of 'color')
        self.btn_run = tk.Button(root, text="START OBFUSCATION", bg="#4CAF50", fg="white", 
                                 font=("Arial", 10, "bold"), command=self.process_files)
        self.btn_run.pack(pady=20)

    def browse(self):
        folder = filedialog.askdirectory()
        if folder:
            self.path_var.set(folder)
            self.log_msg(f"Selected project: {folder}")

    def log_msg(self, msg):
        self.log.insert(tk.END, msg + "\n")
        self.log.see(tk.END)

    def obfuscate_js_content(self, content):
        """Passes JS content to the Node.js obfuscator engine."""
        temp_in = "temp_in.js"
        temp_out = "temp_out.js"
        
        with open(temp_in, "w", encoding="utf-8") as f:
            f.write(content)
        
        # High-security settings for Eprashala LMS logic
        cmd = [
            "javascript-obfuscator", temp_in,
            "--output", temp_out,
            "--compact", "true",
            "--self-defending", "true",
            "--string-array", "true",
            "--string-array-encoding", "rc4",
            "--split-strings", "true"
        ]
        
        subprocess.run(cmd, shell=True, capture_output=True)
        
        if os.path.exists(temp_out):
            with open(temp_out, "r", encoding="utf-8") as f:
                result = f.read()
            os.remove(temp_in)
            os.remove(temp_out)
            return result
        return content

    def process_files(self):
        root_path = self.path_var.get()
        if not root_path:
            messagebox.showwarning("Error", "Please select a folder first.")
            return

        self.btn_run.config(state='disabled')
        output_folder = root_path + "_Obfuscated"
        
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)

        self.log_msg("--- STARTING OBFUSCATION ---")
        
        for subdir, _, files in os.walk(root_path):
            rel_path = os.path.relpath(subdir, root_path)
            target_dir = os.path.join(output_folder, rel_path)
            if not os.path.exists(target_dir):
                os.makedirs(target_dir)

            for file in files:
                file_path = os.path.join(subdir, file)
                save_path = os.path.join(target_dir, file)

                if file.endswith(".js"):
                    self.log_msg(f"Processing JS: {file}")
                    with open(file_path, "r", encoding="utf-8") as f:
                        obs_code = self.obfuscate_js_content(f.read())
                    with open(save_path, "w", encoding="utf-8") as f:
                        f.write(obs_code)

                elif file.endswith(".html"):
                    self.log_msg(f"Processing HTML: {file}")
                    with open(file_path, "r", encoding="utf-8") as f:
                        soup = BeautifulSoup(f.read(), 'html.parser')
                    
                    for script in soup.find_all("script"):
                        if script.string and len(script.string.strip()) > 20:
                            script.string = self.obfuscate_js_content(script.string)
                    
                    with open(save_path, "w", encoding="utf-8") as f:
                        f.write(str(soup))
                else:
                    # Copy images, css, and data files without changes
                    shutil.copy2(file_path, save_path)

        self.log_msg("--- TASK COMPLETE ---")
        self.log_msg(f"Protected version created at: {output_folder}")
        messagebox.showinfo("Success", f"All files protected in:\n{output_folder}")
        self.btn_run.config(state='normal')

if __name__ == "__main__":
    root = tk.Tk()
    app = EprashalaObfuscator(root)
    root.mainloop()