import http.server
import socketserver
import os
# When running in Chaquopy, this points to the extracted files
APP_PATH = os.path.dirname(__file__)
import platform
import string
import urllib.parse

# CONFIGURATION
PORT = 8000
FOLDER_NAME = "Eprashala_LMS"  # The folder to find on drives

def find_usb_root():
    """ Scans ROOT of connected drives for 'Eprashala_LMS'. """
    system = platform.system()
    
    # --- WINDOWS SEARCH ---
    if system == "Windows":
        drives = ['%s:' % d for d in string.ascii_uppercase if d not in 'ABC']
        for drive in drives:
            candidate = os.path.join(drive, "\\", FOLDER_NAME)
            if os.path.exists(candidate): return candidate

    # --- ANDROID SEARCH ---
    elif system == "Linux" and "ANDROID_ROOT" in os.environ:
        base = "/storage"
        if os.path.exists(base):
            for drive_id in os.listdir(base):
                if drive_id in ["self", "emulated", "knox-emulated"]: continue
                candidate = os.path.join(base, drive_id, FOLDER_NAME)
                if os.path.exists(candidate): return candidate
    return None

# --- SETUP PATHS ---
USB_PATH = find_usb_root()
APP_PATH = os.getcwd()

print(f"\n--- EPRASHALA HYBRID SERVER ---")
print(f"🏠 App Logic (HTML/CSS):  {APP_PATH}")
if USB_PATH:
    print(f"💾 Content (MP4/PDF):     {USB_PATH}")
else:
    print(f"⚠️ USB Missing: Content and data.js will fail to load.")

class HybridHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # 1. Clean the URL path
        path = path.split('?')[0].split('#')[0]
        path = urllib.parse.unquote(path)
        path = path.lstrip('/')

        # --- SPECIAL CASE: ROOT ---
        # If asking for site root, give Index.html from APP folder
        if path == "" or path.lower() == "index.html":
            return os.path.join(APP_PATH, "Index.html")

        # --- SPECIAL CASE: data.js ---
        # STRICTLY load from USB. Ignore local copy.
        if path.lower() == "data.js":
            if USB_PATH: return os.path.join(USB_PATH, "data.js")
            else: return os.path.join(APP_PATH, "data.js_MISSING")

        # --- STANDARD CHECK: LOCAL APP FILES ---
        # Search.html, Browser.html, Game.html, Images, CSS
        local_file = os.path.join(APP_PATH, path)
        if os.path.exists(local_file):
            return local_file

        # --- FALLBACK CHECK: USB CONTENT ---
        # .mp4, .pdf, .enc files that are NOT in the app folder
        if USB_PATH:
            usb_file = os.path.join(USB_PATH, path)
            if os.path.exists(usb_file):
                return usb_file
        
        # If not found anywhere, default to local (returns 404)
        return local_file

# Allow port reuse (Restart without waiting)
socketserver.TCPServer.allow_reuse_address = True

print(f"🚀 Server Online: http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), HybridHandler) as httpd:
    httpd.serve_forever()