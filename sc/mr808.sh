#!/bin/bash

/usr/bin/xvfb-run --server-args="-screen 0, 1280x800x24"  /usr/bin/sclang -D -g 10m -m 50m /root/MR-808/sc/seq.sc
