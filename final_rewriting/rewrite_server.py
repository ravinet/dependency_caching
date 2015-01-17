#!/usr/bin/env python
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import SocketServer

class Request_Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        print post_data

def run(server_class=HTTPServer, handler_class=Request_Handler, port=80):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print 'Listening on port ' + str(port)
    httpd.serve_forever()

if __name__ == "__main__":
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
