#!/bin/bash

mkdir -p extensions/presto

presto_extensions_url="https://twnjvsgdghpmtpzyedgm.supabase.co/storage/v1/object/public/bas-bots/extensions/presto/0.77.0_0.rar"

file_name=$(basename "$presto_extensions_url")

curl -sSfL -o "extensions/presto/$file_name" "$presto_extensions_url"

unrar x -o+ "extensions/presto/$file_name" "extensions/presto/"

rm "extensions/presto/$file_name"