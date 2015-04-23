import os
import sys
import subprocess

# recorded folder to be copied and rewritten
recorded_folder = sys.argv[1]
rewritten_folder = sys.argv[2]

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

    # prepend the scheduler (js and html) and rewrite html

    if ( ("html" in out) or ("javascript" in out) ): # html or javascript file, so rewrite
        if ( "chunked" in out ): # response chunked so we must unchunk
            os.system( "python unchunk.py rewritten/tempfile rewritten/tempfile1" )
            os.system( "mv rewritten/tempfile1 rewritten/tempfile" )
            # remove transfer-encoding chunked header from original file since we are unchunking
            os.system( "removeheader rewritten/" + filename + " Transfer-Encoding" )
        if ( "not" in out ): # html or javascript but not gzipped
            if ( "javascript" in out ):
                os.system('cp scheduler.js rewritten/prependtempfile')
                os.system('cat rewritten/tempfile >> rewritten/prependtempfile')
                os.system('mv rewritten/prependtempfile rewritten/tempfile')
            if ( "html" in out ): # rewrite all inline js in html files
               os.system('cat scheduler.html >> rewritten/prependtempfile')
               os.system('cat rewritten/tempfile >> rewritten/prependtempfile')
               os.system('mv rewritten/prependtempfile rewritten/tempfile')
               os.system('python rewrite_image_tags.py rewritten/tempfile >> rewritten/htmltempfile')
               os.system('mv rewritten/htmltempfile rewritten/tempfile')
               body = open("rewritten/tempfile", 'r')
               first_line = body.readline()
               if ( "<!doctype html>" in first_line.lower() ):
                   new_file = open("rewritten/prependtempfile", 'a')
                   new_file.write("<!doctype html>\n")
                   new_file.close()
               body.close()


            # get new length of response
            size = os.path.getsize('rewritten/tempfile')

            # convert modified file back to protobuf
            os.system( "texttoproto rewritten/tempfile rewritten/" + filename )

            # add new content length header
            os.system( "changeheader rewritten/" + filename + " Content-Length " + str(size) )
        else: # gzipped
            os.system("gzip -d -c rewritten/tempfile > rewritten/plaintext")
            if ( "javascript" in out ):
                os.system('cp scheduler.js rewritten/prependtempfile')
                os.system('cat rewritten/plaintext >> rewritten/prependtempfile')
                os.system('mv rewritten/prependtempfile rewritten/plaintext')


            if ( "html" in out ): # rewrite all inline js in html files
                os.system('cat scheduler.html >> rewritten/prependtempfile')
                os.system('cat rewritten/plaintext >> rewritten/prependtempfile')
                os.system('mv rewritten/prependtempfile rewritten/plaintext')
                os.system('python rewrite_image_tags.py rewritten/plaintext >> rewritten/htmltempfile')
                os.system('mv rewritten/htmltempfile rewritten/plaintext')
                body = open("rewritten/plaintext", 'r')
                first_line = body.readline()
                if ( "<!doctype html>" in first_line.lower() ):
                    new_file = open("rewritten/prependtempfile", 'a')
                    new_file.write("<!doctype html>\n")
                    new_file.close()
                body.close()

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

os.system("mv rewritten " + rewritten_folder)
