{
    "targets": [{
        "target_name": "pulse_worker",
        "sources": [ "worker.cpp" ],
        'cflags': [ '-fexceptions' ],
        'cflags_cc': [ '-fexceptions' ],
        "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")",
            "/usr/include"
        ],
        "libraries": [
            "/usr/lib/x86_64-linux-gnu/libpulse.so"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }]
}
