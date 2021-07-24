proxychains ping $1 -c 1 | grep ttl | sed 's/.*ttl=\([[:digit:]]*\).*/\1/'
proxychains arp $1 | grep -o -E '([[:xdigit:]]{1,2}:){5}[[:xdigit:]]{1,2}'