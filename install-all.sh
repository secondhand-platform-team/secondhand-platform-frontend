#!/bin/bash
echo "=====Installing dependencies for all web apps...====="

web_apps=("web-admin" "web-client")

for app in "${web_apps[@]}"; do
  echo "=====Installing $app...====="
  cd $app && npm install && cd ..
done

echo "=====Done dependencies!====="