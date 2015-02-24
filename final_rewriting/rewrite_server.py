#!/usr/bin/env python
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import SocketServer
import base64
import sys

class Request_Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        #content_length += 5
        print content_length
        post_data = self.rfile.read(content_length)
        #print post_data
        #print base64.b64decode(post_data)
        print >> sys.stderr, 'DONE'
        

def run(server_class=HTTPServer, handler_class=Request_Handler, port=8090):
    server_address = ('127.0.0.1', port)
    httpd = server_class(server_address, handler_class)
    print 'Listening on port ' + str(port)
    httpd.serve_forever()

if __name__ == "__main__":
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
