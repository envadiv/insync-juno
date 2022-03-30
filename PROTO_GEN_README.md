# Custom Msg adding to cosmjs-client 


## Deps 
```
1.[Install protoc](https://github.com/protocolbuffers/protobuf/releases/download/v3.17.3/protoc-3.17.3-linux-x86_64.zip)
2. Install nodejs deps 
    $ npm i ts-proto google-protobuf
```

## Proto Generation
```
$ protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \                                                        
    --ts_proto_opt=esModuleInterop=true \
    --ts_proto_out=./src/generated \
    --ts_proto_opt=snakeToCamel=false src/proto/msg_claim.proto
```