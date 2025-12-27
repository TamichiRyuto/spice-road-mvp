#!/bin/bash

# install golang
# wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz
# rm -rf /usr/local/go && tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz
# export PATH=$PATH:/usr/local/go/bin
# rm go1.25.5.linux-amd64.tar.gz

# install asdf-vm
# go install github.com/asdf-vm/asdf/cmd/asdf@v0.18.0

# insatll packages from asdf
# export PATH=$PATH:$HOME/.asdf/bin:$HOME/.asdf/shims

asdf plugin add nodejs
asdf plugin add terraform