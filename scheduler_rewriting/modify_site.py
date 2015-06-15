import os
import sys
import subprocess

# recorded folder to be copied and rewritten
recorded_folder = sys.argv[1]
dot_file = sys.argv[2]
rewritten_folder = sys.argv[3]
start_node = "/"
if ( len(sys.argv) == 5 ):
    start_node = sys.argv[4]

# get parent and depth info (to prepend to scheduler)
command1 = "python process_dot.py " + str(dot_file) + " " + start_node
proc = subprocess.Popen([command1], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
(out1,err1) = proc.communicate()
depths = err1.strip("\n")
parents = out1.strip("\n")
scheduler_prepend = "<script>\nwindow.scheduler_depths = " + depths + ";\nwindow.scheduler_parents = " + parents +";\n"

# temp folder to store rewritten protobufs
os.system("rm -rf rewritten")
os.system( "cp -r " + recorded_folder + " rewritten" )

files = os.listdir("rewritten")

for filename in files:
    print filename

    # convert response in protobuf to text (ungzip if necessary)
    command = "protototext rewritten/" + filename + " rewritten/tempfile"
    proc = subprocess.Popen([command], stdout=subprocess.PIPE, shell=True)
    (out, err) = proc.communicate()
    return_code = proc.returncode
    out = out.strip("\n")
    print out
    # need to still handle if response is chunked and gzipped (we can't just run gzip on it)!

    if ( ("html" in out) or ("javascript" in out) ): # html or javascript file, so rewrite
        if ( "chunked" in out ): # response chunked so we must unchunk
            os.system( "python unchunk.py rewritten/tempfile rewritten/tempfile1" )
            os.system( "mv rewritten/tempfile1 rewritten/tempfile" )
            # remove transfer-encoding chunked header from original file since we are unchunking
            os.system( "removeheader rewritten/" + filename + " Transfer-Encoding" )
        if ( "not" in out ): # html or javascript but not gzipped
            #if ( "javascript" in out ):
            #    os.system('cp scheduler.js rewritten/prependtempfile')
            #    os.system('cat rewritten/tempfile >> rewritten/prependtempfile')
            #    os.system('mv rewritten/prependtempfile rewritten/tempfile')
            if ( "html" in out ): # rewrite all inline js in html files
               html_obj_name = out.split("name=")[1]
               command = "python rewrite_image_tags.py rewritten/tempfile"
               proc = subprocess.Popen([command], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
               (out,err) = proc.communicate()
               image_map = err.strip("\n")
               curr_scheduler_prepend = scheduler_prepend + "window.prefetch = " + image_map +";\n" + "window.html_name = \"" + html_obj_name + "\";\n"
               file1 = open("rewritten/prependtempfile", "w")
               file1.write(curr_scheduler_prepend)
               file1.write("window.chunked_html = " + out.strip("\n") + ";\n")
               file1.close()
               os.system('cat scheduler.html >> rewritten/prependtempfile')
               os.system('mv rewritten/prependtempfile rewritten/tempfile')

            # get new length of response
            size = os.path.getsize('rewritten/tempfile')

            # convert modified file back to protobuf
            os.system( "texttoproto rewritten/tempfile rewritten/" + filename )

            # add new content length header
            os.system( "changeheader rewritten/" + filename + " Content-Length " + str(size) )
        else: # gzipped
            os.system("gzip -d -c rewritten/tempfile > rewritten/plaintext")
            #if ( "javascript" in out ):
                #os.system('cp scheduler.js rewritten/prependtempfile')
                #os.system('cat rewritten/plaintext >> rewritten/prependtempfile')
                #os.system('mv rewritten/prependtempfile rewritten/plaintext')

            if ( "html" in out ): # rewrite all inline js in html files
                html_obj_name = out.split("name=")[1]
                command = "python rewrite_image_tags.py rewritten/plaintext"
                proc = subprocess.Popen([command], stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
                (out,err) = proc.communicate()
                image_map = err.strip("\n")
                curr_scheduler_prepend = scheduler_prepend + "window.prefetch = " + image_map +";\n" + "window.html_name = \"" + html_obj_name + "\";\n"
                file1 = open("rewritten/prependtempfile", "w")
                file1.write(curr_scheduler_prepend)
                file1.write("window.chunked_html = " + out.strip("\n") + ";\n")
                file1.close()
                os.system('cat scheduler.html >> rewritten/prependtempfile')
                os.system('mv rewritten/prependtempfile rewritten/plaintext')

            # after modifying plaintext, gzip it again (gzipped file is 'finalfile')
            os.system( "gzip -c rewritten/plaintext > rewritten/finalfile" )

            # get new length of response
            size = os.path.getsize('rewritten/finalfile')

            # convert modified file back to protobuf
            os.system( "texttoproto rewritten/finalfile rewritten/" + filename )

            # add new content length header to the newly modified protobuf (name is filename)
            os.system( "changeheader rewritten/" + filename + " Content-Length " + str(size) )

            # delete temp files
            os.system("rm rewritten/plaintext")
            os.system("rm rewritten/finalfile")
    # delete original tempfile
    os.system("rm rewritten/tempfile")

    # allow CORS for each file!
    os.system("changeheader rewritten/" + filename + " Access-Control-Allow-Origin '*'")
os.system("mv rewritten " + rewritten_folder)
