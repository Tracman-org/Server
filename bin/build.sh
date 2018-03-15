#!/bin/bash
# bin/build.sh

## Set working directory
cd $(dirname $0)/..

## Compile changed CSS with less
# Check for css folder
if [ ! -d static/css ]; then
	echo "static/css directory not found!"
else
	for oldfile in static/css/*.css; do
		newfile="static/css/.$(basename ${oldfile%.*}).min.css"
		# Check if compiled version doesn't exist or the uncompiled one's changed
		if [ ! -f $newfile ] || [ "$(stat -c %Y $oldfile)" -gt "$(stat -c %Y $newfile)" ]; then
			echo "Compiling $oldfile to $newfile..."
			node_modules/less/bin/lessc \
				--clean-css $oldfile $newfile
		fi
	done
fi

## Minify modified javascript files with uglifyjs
# Check for js folder
if [ ! -d static/js ]; then
	echo "static/css directory not found!"
else
	for oldfile in static/js/*.js; do
		newfile="static/js/.$(basename ${oldfile%.*}).min.js"
		# Check if minified version doesn't exist or the minified one's changed
		if [ ! -f $newfile ] || [ "$(stat -c %Y $oldfile)" -gt "$(stat -c %Y $newfile)" ]; then
			echo "Minifying $oldfile to $newfile..."
			node_modules/uglify-es/bin/uglifyjs \
				$oldfile --output $newfile \
				--verbose --compress --mangle 'reserved=google.maps'
		fi
	done
fi

exit 0
