#include <thread>
#include <napi.h>
#include <stdio.h>
#include <pulse/pulseaudio.h>
#include <vector>


using namespace std;
using namespace Napi;

std::thread nativeThread;

void mainLoop(Napi::Env env, ThreadSafeFunction tsfn){
    fprintf(stderr,"this program will monitor the output of audio devices\n");
    fprintf(stderr,"the code closely refrects the one you can find at http://ysflight.in.coocan.jp/programming/audio/pulseAudioSample/e.html, which I used as a tutorial\n");
    
    
    pa_mainloop* mainloop = pa_mainloop_new();
    if(mainloop == NULL){
        fprintf(stderr,"pa_mainloop_new: Cannot create main loop\n");
        exit(1);
    }
    pa_context *ctx = pa_context_new(pa_mainloop_get_api(mainloop),"record_ctx");
    if(ctx == NULL){
        fprintf(stderr,"pa_context_new: Cannot create context\n");
        exit(1);
    }
    
    pa_context_connect(ctx,NULL,(pa_context_flags_t)0,NULL);
    
    //wait until the loop is ready
    while(true)
    {
        pa_mainloop_iterate(mainloop,0,NULL);
        if(pa_context_get_state(ctx)==PA_CONTEXT_READY){
            break;
        }
    }
    //YsPulseAudioWaitForConnectionEstablished(ctx,mainloop,5);
    fprintf(stderr,"ready fired!!\n");
    
    
    //this settings will mirror the client side javascript
    //PA_SAMPLE_FLOAT32LE  32 Bit IEEE floating point, little endian (PC), range -1.0 to 1.0
    const pa_sample_spec ss = {
        .format = PA_SAMPLE_FLOAT32LE,
        .rate = 44100,
        .channels = 2
    };
    
    pa_stream *recording_stream=pa_stream_new(ctx,"record_stream",&ss,NULL);
    if(recording_stream == NULL){
        fprintf(stderr,"pa_stream_new: Cannot create stream\n");
        exit(1);
    }
    
    pa_stream_connect_record(
        recording_stream,//pa_stream * 	s,
        NULL,//const char * 	dev,
        NULL,//const pa_buffer_attr * 	attr,
        PA_STREAM_NOFLAGS //pa_stream_flags_t 	flags 
    );
    
    fprintf(stderr,"mainloop, context, and stream created. Entering main loop\n");
    
    //main loop
    while(1){
        //break;
        //fprintf(stderr,"just normal loop\n");
        if(pa_stream_get_state(recording_stream) == PA_STREAM_READY){
            size_t readable_size = pa_stream_readable_size(recording_stream);
            if(readable_size > 0){
                pa_usec_t timestamp;
                pa_stream_get_time(
                    recording_stream,
                    &timestamp
                );
                const void *data;
                size_t read_size;
                pa_stream_peek(
                    recording_stream,
                    &data,
                    &read_size
                );
                vector<uint8_t>* vec = new vector<uint8_t>();
                vec->insert(vec->end(),&((uint8_t*)data)[0],&((uint8_t*)data)[read_size]);
                napi_status status = tsfn.BlockingCall( vec, []( Napi::Env env, Function jsCallback, vector<uint8_t>* vec ) {
                    jsCallback.Call( {Buffer<uint8_t>::Copy(env, &(vec->at(0)), vec->size())} );
                    delete vec;
                } );
                if ( status != napi_ok ){
                    // Handle error
                    break;
                }
                pa_stream_drop(recording_stream);
            }
        }
        int itr_result = pa_mainloop_iterate(mainloop,0,NULL);
        if(itr_result < 0)break;
    }
    
    //free everything!
    pa_stream_disconnect(recording_stream);
    pa_stream_unref(recording_stream);
    pa_context_disconnect(ctx);
    pa_context_unref(ctx);
    pa_mainloop_free(mainloop);
    
    fprintf(stderr,"successfully exiting\n");
}




Value RegisterCallback( const CallbackInfo& info ){
    Napi::Env env = info.Env();
    if ( info.Length() < 1 ){
        throw Error::New( env, "usage: registerCallback(function)" );
    }
    else if ( !info[0].IsFunction() )
    {
        throw Error::New( env, "Expected first arg to be function" );
    }
    
    
    auto tsfn = ThreadSafeFunction::New(
        env,
        info[0].As<Function>(),  // JavaScript function called asynchronously
        "some loop",             // Name
        0,                       // Unlimited queue
        1,                       // Only one thread will use this initially
        []( Napi::Env ) {        // Finalizer used to clean threads up
          nativeThread.join();
        } );
    
    nativeThread = std::thread( [env,tsfn] {
        mainLoop(env,tsfn);
        // Release the thread-safe function
        tsfn.Release();
    } );
    return Boolean::New(env, true);
}




Object Init(Env env, Object exports) {
    exports.Set( "onChunk", Function::New( env, RegisterCallback ) );
    return exports;
}

NODE_API_MODULE(testaddon, Init)


