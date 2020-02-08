import time
from bs4 import BeautifulSoup
import bs4
import requests
import http.server
import socketserver
import time
import json
import os
import webbrowser
from queue import Queue, Empty
import threading
import socket
import re
import jinja2
import prettierfier
from requests_toolbelt.multipart import decoder
import urllib.parse
from datetime import datetime

orig_prettify = bs4.BeautifulSoup.prettify
r = re.compile(r'^(\s*)', re.MULTILINE)
def prettify(self, encoding=None, formatter="minimal", indent_width=4):
    return r.sub(r'\1' * indent_width, orig_prettify(self, encoding, formatter))
bs4.BeautifulSoup.prettify = prettify

def clear_logs():
    with open("http_log.txt", "w") as f:
        f.write("")
    with open("tlog.txt", "w") as f:
        f.write("")


clear_logs()
import socket
import psutil


if os.path.exists("config.json") == False:
    print("writing base config")
    config = {
        "port": 8080,
    }

    with open("config.json", "w") as f:
        f.write(json.dumps(config, indent=4))
    input("please make any changes to the config you want and then press enter.")

with open("config.json", "r") as f:
    config = json.loads(f.read())




PORT = config["port"]
rewrite_host = "http://10.0.0.16:{}".format(PORT)

local_host = "http://localhost:{}".format(PORT)

"""
html = jinga2Template('applicaion_templates/notes_item.html',{
    'content':notes,
    'add_url':'/pe/api/notes/add?url='+ urllib.parse.quote(qs['url']),
})
"""

def jinga2Template(file,args={}):
    templateLoader = jinja2.FileSystemLoader(searchpath="./")
    templateEnv = jinja2.Environment(loader=templateLoader)
    TEMPLATE_FILE = file
    template = templateEnv.get_template(TEMPLATE_FILE)
    outputText = template.render(args)
    return outputText
    

def cookieToDict(cs):
    if cs is None:
        return {}
    out = {}
    for cook in cs.split(";"):
        a = cook.split("=")
        out[a[0]] = a[1]
    return out


def qsToDict(qs):
    out = {}
    for item in qs.split("&"):
        item = item.split("=")
        out[item[0]] = item[1]
    return out


class MyHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        if "?" not in self.path:
            qs = ""
            path = self.path
        else:
            path = self.path.split("?")
            qs = qsToDict(path[1])
            path = path[0]
        if path =='/':
            path = 'index.html'
        p_f_path = 'public/'+ path
        if os.path.exists(p_f_path):
            with open(p_f_path,'rb') as f:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(f.read())
                return
        self.send_response(200)
#        self.send_header(header, res.headers[header])
        self.end_headers()
        content = "test"
        try:

            self.wfile.write(content.encode('utf-8'))
        except OSError as e:
            pass

    def log_message(self, fmt, *args):
        with open("http_log.txt", "a") as f:
            f.write(fmt % args)
            f.write("\n")


def t_log(msg =''):
    with open("tlog.txt", "a",encoding='utf-8-sig') as f:
        f.write(msg + "\n")


cmd_queue = Queue()
report_queue = Queue()


class mythread(threading.Thread):
    def __init__(self, q_in, q_out):
        threading.Thread.__init__(self)
        self.q_in = q_in
        self.q_out = q_out
        t_log("t_hello")

    def run(self):
        global config, PORT
        t_log("t_run")
        Handler = MyHandler
        is_server_running = False
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
            self.q_out.put("tstart")
            while True:
                if is_server_running:
                    t_log("t_handle")
                    httpd.handle_request()
                else:
                    t_log("t_sleep")
                    time.sleep(1)

                try:
                    cmd = self.q_in.get(block=False)

                    t_log("cmd:" + cmd)
                    if cmd == "stop":
                        is_server_running = False
                        self.q_out.put("s_stop")
                    elif cmd == "start":
                        is_server_running = True
                        self.q_out.put("s_start")
                    elif cmd == "reload":
                        with open("config.json", "r") as f:
                            config = json.loads(f.read())
                        self.q_out.put("s_reload_config")

                    elif cmd == "shutdown":
                        break
                except Empty:
                    pass

        t_log("t_goodbuy")


def menu(title, options):
    menu = ""
    for i, o in enumerate(options):
        menu += "{}. {}\n".format(i, o)
    while True:
        print("~MenuTitle: " + title)
        print("#" * 16)
        print(menu)
        try:
            uin = int(input(">"))
            print()
            if uin < len(options.keys()):
                option = list(options.keys())[uin]
                if callable(options[option]):
                    ret = options[option]()
                elif type(options[option]) == str:
                    ret = options[option]
                elif options[option] is None:
                    return None

                print()
                return ret
        except Exception as e:
            print(e)
            return False


def reload_config():
    cmd_queue.put("reload")
    try:
        requests.get(rewrite_host, timeout=1)
    except Exception as e:
        pass
    return True


def start_server():
    cmd_queue.put("start")
    try:
        requests.get(rewrite_host, timeout=1)
    except Exception as e:
        pass
    return True


def stop_server():
    cmd_queue.put("stop")
    try:
        requests.get(rewrite_host, timeout=1)
    except Exception as e:
        pass
    return True


def shutdown_thread():
    cmd_queue.put("shutdown")
    try:
        requests.get(rewrite_host, timeout=1)
    except Exception as e:
        pass
    return True


def toggle_server():
    global server_running
    if server_running:
        stop_server()
    else:
        start_server()
    return True


def open_links():
    webbrowser.open(rewrite_host)
    return True


def stop_refresh():
    cmd_queue.put("stop_reload")
    try:
        requests.get(rewrite_host, timeout=1)
    except Exception as e:
        pass
    return True


thread1 = mythread(cmd_queue, report_queue)
thread1.start()

cmd_queue.put("start")
report_queue.get()
seleced_page = None
server_running = False
failed = 0
print('waiting for server to start.',end='')
ping_url =rewrite_host+'/pe/api/ping'
try:
    while failed < 15:
        print('.',end='')
        try:
            if requests.get(ping_url,timeout=1).status_code == 200:
                print('server online!')
                break
        except requests.exceptions.ReadTimeout:
            failed +=1
            time.sleep(1)

    print()
    while True:
        while not report_queue.empty():
            data = report_queue.get(block=False)
            if data == "s_start":
                server_running = True
            elif data == "s_stop":
                server_running = False
            else:
                print("message from thread:", data)

        ret = menu(
            "proxy edit",
            {
                "Open Links": open_links,
                "Reload Config": reload_config,
                "stop auto-refresh": stop_refresh,
                ("stop" if server_running else "start") + " server": toggle_server,
                "exit": None,
            },
        )
        if ret is None:
            break
except KeyboardInterrupt:
    pass
try:
    print("please wait shutting down.")
    shutdown_thread()
    thread1.join()
except Exception as e:
    pass
