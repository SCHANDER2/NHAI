/**
 * NHAI Datalake 3.0 - Offline Secure Face Biometrics Engine
 * File: NhaiJsiBridge.cpp
 * Description: JSI binding implementation. Registers and exposes synchronous
 *              methods directly into the React Native JS runtime global space.
 */

#include "NhaiJsiBridge.h"
#include <iostream>

namespace nhai {

using namespace facebook;

// Helper: Converts C++ float vector to JS Array
jsi::Array NhaiJsiBridge::convertVectorToJsiArray(jsi::Runtime& runtime, const std::vector<float>& vec) {
    jsi::Array result(runtime, vec.size());
    for (size_t i = 0; i < vec.size(); ++i) {
        result.setValueAtIndex(runtime, i, jsi::Value(static_cast<double>(vec[i])));
    }
    return result;
}

// Helper: Converts JS Array to C++ float vector
std::vector<float> NhaiJsiBridge::convertJsiArrayToVector(jsi::Runtime& runtime, const jsi::Array& arr) {
    size_t length = arr.size(runtime);
    std::vector<float> result(length);
    for (size_t i = 0; i < length; ++i) {
        result[i] = static_cast<float>(arr.getValueAtIndex(runtime, i).asNumber());
    }
    return result;
}

// Install function: Hooks global.NhaiFaceEngine in the JS Runtime
void NhaiJsiBridge::install(jsi::Runtime& runtime, std::shared_ptr<NhaiFaceEngine> engine) {
    auto jsiModule = std::make_shared<NhaiJsiBridge>(engine);
    auto object = jsi::Object::createFromHostObject(runtime, jsiModule);
    
    // Bind to the global runtime variable
    runtime.global().setProperty(runtime, "NhaiFaceEngine", std::move(object));
    std::cout << "[NHAI Biometrics] React Native JSI Module successfully installed." << std::endl;
}

// Get override: Maps property calls to direct execution lambda closures
jsi::Value NhaiJsiBridge::get(jsi::Runtime& runtime, const jsi::PropNameID& name) {
    std::string propName = name.utf8(runtime);

    // 1. global.NhaiFaceEngine.init(modelDirPath: string)
    if (propName == "init") {
        return jsi::Function::createFromHostFunction(
            runtime,
            name,
            1, // expects 1 parameter
            [this](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
                if (count < 1 || !args[0].isString()) {
                    throw jsi::JSError(rt, "NhaiFaceEngine.init expects modelDirectoryPath as string");
                }
                
                std::string path = args[0].asString(rt).utf8(rt);
                bool success = mEngine->init(path);
                return jsi::Value(success);
            }
        );
    }

    // 2. global.NhaiFaceEngine.processFrame(frameDataBuffer: ArrayBuffer, width: number, height: number, challenge: string)
    if (propName == "processFrame") {
        return jsi::Function::createFromHostFunction(
            runtime,
            name,
            4, // expects 4 parameters
            [this](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
                if (count < 4 || !args[0].isObject() || !args[1].isNumber() || !args[2].isNumber() || !args[3].isString()) {
                    throw jsi::JSError(rt, "NhaiFaceEngine.processFrame expects (ArrayBuffer, width, height, challenge)");
                }

                int w = static_cast<int>(args[1].asNumber());
                int h = static_cast<int>(args[2].asNumber());
                std::string challenge = args[3].asString(rt).utf8(rt);

                // Access the underlying ArrayBuffer bytes directly without data copying overhead
                jsi::Object bufferObj = args[0].asObject(rt);
                if (!bufferObj.isArrayBuffer(rt)) {
                    throw jsi::JSError(rt, "First argument must be a valid raw JavaScript ArrayBuffer");
                }

                jsi::ArrayBuffer buffer = bufferObj.getArrayBuffer(rt);
                uint8_t* rawData = buffer.data(rt);
                
                // Wrap raw data inside an OpenCV Mat header (zero memory copy!)
                cv::Mat frameMat(h, w, CV_8UC4, rawData); // RGBA raw texture

                // Run the biometrics engine
                FrameResult result = mEngine->processFrame(frameMat, challenge);

                // Build return JS Object synchronously
                jsi::Object resObj(rt);
                resObj.setProperty(rt, "faceDetected", jsi::Value(result.faceDetected));
                resObj.setProperty(rt, "livenessScore", jsi::Value(static_cast<double>(result.livenessScore)));
                resObj.setProperty(rt, "livenessVerified", jsi::Value(result.livenessVerified));
                resObj.setProperty(rt, "ear", jsi::Value(static_cast<double>(result.ear)));
                resObj.setProperty(rt, "mar", jsi::Value(static_cast<double>(result.mar)));
                resObj.setProperty(rt, "yaw", jsi::Value(static_cast<double>(result.yaw)));

                if (result.faceDetected) {
                    jsi::Object boxObj(rt);
                    boxObj.setProperty(rt, "x1", jsi::Value(static_cast<double>(result.box.x1)));
                    boxObj.setProperty(rt, "y1", jsi::Value(static_cast<double>(result.box.y1)));
                    boxObj.setProperty(rt, "x2", jsi::Value(static_cast<double>(result.box.x2)));
                    boxObj.setProperty(rt, "y2", jsi::Value(static_cast<double>(result.box.y2)));
                    resObj.setProperty(rt, "box", std::move(boxObj));
                }

                return jsi::Value(rt, resObj);
            }
        );
    }

    // 3. global.NhaiFaceEngine.extractEmbedding(frameDataBuffer: ArrayBuffer, width: number, height: number): Array
    if (propName == "extractEmbedding") {
        return jsi::Function::createFromHostFunction(
            runtime,
            name,
            3,
            [this](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
                if (count < 3 || !args[0].isObject() || !args[1].isNumber() || !args[2].isNumber()) {
                    throw jsi::JSError(rt, "NhaiFaceEngine.extractEmbedding expects (ArrayBuffer, width, height)");
                }

                int w = static_cast<int>(args[1].asNumber());
                int h = static_cast<int>(args[2].asNumber());
                
                jsi::Object bufferObj = args[0].asObject(rt);
                jsi::ArrayBuffer buffer = bufferObj.getArrayBuffer(rt);
                uint8_t* rawData = buffer.data(rt);
                
                cv::Mat frameMat(h, w, CV_8UC4, rawData);
                
                // 1. Detect landmarks first to perform face alignment
                FrameResult details = mEngine->processFrame(frameMat, "NONE");
                if (!details.faceDetected) {
                    return jsi::Value::null();
                }

                // 2. Perform affine crop and align
                cv::Mat aligned = mEngine->alignFace(frameMat, details.landmarks);

                // 3. Extract embedding using MobileFaceNet
                std::vector<float> embedding = mEngine->extractEmbedding(aligned);

                // Convert std::vector to JS float array
                return jsi::Value(rt, convertVectorToJsiArray(rt, embedding));
            }
        );
    }

    // 4. global.NhaiFaceEngine.compareEmbeddings(emb1: Array, emb2: Array): number
    if (propName == "compareEmbeddings") {
        return jsi::Function::createFromHostFunction(
            runtime,
            name,
            2,
            [this](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) -> jsi::Value {
                if (count < 2 || !args[0].isObject() || !args[1].isObject()) {
                    throw jsi::JSError(rt, "NhaiFaceEngine.compareEmbeddings expects (emb1: Array, emb2: Array)");
                }

                jsi::Array arr1 = args[0].asObject(rt).asArray(rt);
                jsi::Array arr2 = args[1].asObject(rt).asArray(rt);

                std::vector<float> emb1 = convertJsiArrayToVector(rt, arr1);
                std::vector<float> emb2 = convertJsiArrayToVector(rt, arr2);

                float score = mEngine->compareEmbeddings(emb1, emb2);
                return jsi::Value(static_cast<double>(score));
            }
        );
    }

    return jsi::Value::undefined();
}

} // namespace nhai
