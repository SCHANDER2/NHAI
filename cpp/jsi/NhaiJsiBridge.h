/**
 * NHAI Datalake 3.0 - Offline Secure Face Biometrics Engine
 * File: NhaiJsiBridge.h
 * Description: JSI (JavaScript Interface) HostObject declarations for React Native.
 *              Allows synchronous execution of C++ code directly from the JS thread.
 */

#pragma once

// React Native JSI headers (provided by React Native framework in standard builds)
#pragma warning(push)
#pragma warning(disable: 4100 4244 4251) // Disable MSVC warnings for external React Native JSI headers
#include <jsi/jsi.h>
#pragma warning(pop)

#include "../NhaiFaceEngine.h"
#include <memory>

namespace nhai {

using namespace facebook;

class NhaiJsiBridge : public jsi::HostObject {
private:
    std::shared_ptr<NhaiFaceEngine> mEngine;

    // Helper functions to convert C++ vectors to JSI objects and arrays
    jsi::Array convertVectorToJsiArray(jsi::Runtime& runtime, const std::vector<float>& vec);
    std::vector<float> convertJsiArrayToVector(jsi::Runtime& runtime, const jsi::Array& arr);

public:
    explicit NhaiJsiBridge(std::shared_ptr<NhaiFaceEngine> engine) : mEngine(engine) {}
    virtual ~NhaiJsiBridge() = default;

    /**
     * Overrides the JSI HostObject 'get' method. Intercepts calls from JS and maps
     * them directly to native C++ actions synchronously.
     */
    jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

    /**
     * Registers this C++ bridge object into the JavaScript global environment.
     * Accessible in JS as global.NhaiFaceEngine
     */
    static void install(jsi::Runtime& runtime, std::shared_ptr<NhaiFaceEngine> engine);
};

} // namespace nhai
