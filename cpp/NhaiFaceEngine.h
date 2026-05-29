/**
 * NHAI Datalake 3.0 - Offline Secure Face Biometrics Engine
 * File: NhaiFaceEngine.h
 * Version: 2.1.0 (Security & Performance Optimized)
 * Description: Core C++ biometrics engine wrapper utilizing OpenCV Mobile and ncnn framework.
 *              Upgraded with OpenCV CLAHE local luminance balancing to support harsh Indian outdoor glares.
 */

#pragma once

#pragma warning(push)
#pragma warning(disable: 4996 4244 4267)
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>
#pragma warning(pop)

#include <vector>
#include <string>
#include <memory>

namespace nhai {

// Bounding box for detected faces
struct FaceBox {
    float x1, y1, x2, y2;
    float score;
};

// Sub-pixel coordinates for facial landmarks (e.g. eye corners, mouth corners, nose bridge)
struct Point2f {
    float x;
    float y;
};

// Output of a full frame analysis session
struct FrameResult {
    bool faceDetected = false;
    FaceBox box;
    std::vector<Point2f> landmarks; // 98 landmark coordinates (PFLD model)
    float livenessScore = 0.0f;     // Anti-spoofing confidence
    bool livenessVerified = false;
    
    // Heuristics calculations
    float ear = 0.0f; // Eye Aspect Ratio (for blink)
    float mar = 0.0f; // Mouth Aspect Ratio (for smile)
    float yaw = 0.0f; // Head yaw rotation (for head turn)
};

class NhaiFaceEngine {
private:
    bool isInitialized = false;
    
    // Smart pointers to hold mock raw network data contexts to guarantee zero memory leaks
    std::unique_ptr<void, void(*)(void*)> faceNet;
    std::unique_ptr<void, void(*)(void*)> landmarkNet;
    std::unique_ptr<void, void(*)(void*)> recognizerNet;

    // Active liveness challenge tracker
    std::string activeChallengeType = "NONE"; // "BLINK", "SMILE", "TURN_HEAD"
    bool challengeTriggered = false;
    int blinkCount = 0;
    bool eyesClosed = false;

    // Advanced adaptive preprocessing context for harsh Indian lighting conditions
    // CLAHE (Contrast Limited Adaptive Histogram Equalization) prevents shadows and glares
    cv::Ptr<cv::CLAHE> mClaheProcessor;

    // Helper functions for anti-spoofing calculations
    float calculateEAR(const std::vector<Point2f>& landmarks);
    float calculateMAR(const std::vector<Point2f>& landmarks);
    float calculateYaw(const std::vector<Point2f>& landmarks);

public:
    NhaiFaceEngine();
    ~NhaiFaceEngine();

    // Prevent copying to avoid multiple reference deletes of unique pointers
    NhaiFaceEngine(const NhaiFaceEngine&) = delete;
    NhaiFaceEngine& operator=(const NhaiFaceEngine&) = delete;

    /**
     * Initializes the C++ engine, loading the compressed ncnn models into memory
     * Configures ncnn with 'set_light_mode(true)' for aggressive RAM collection on 3GB devices
     * @param modelDirPath Directory path containing face_detect.bin/param, landmarks.bin/param, and face_rec.bin/param
     * @return true if all models are loaded successfully
     */
    bool init(const std::string& modelDirPath);

    /**
     * Preprocesses image using CLAHE adaptive histogram equalization
     * Normalizes the image's local contrast, rendering shadows and highlights details clearly
     * @param src Original source matrix (RGBA or Grayscale)
     * @return Contrast-balanced Mat ready for AI inference
     */
    cv::Mat balanceLighting(const cv::Mat& src);

    /**
     * Processes an incoming camera frame in YUV/RGBA format
     * @param frameMat Pre-processed OpenCV matrix (RGBA format)
     * @param challenge Action requested from user ("BLINK", "SMILE", "TURN_HEAD")
     * @return FrameResult containing bounding boxes, landmarks, and liveness states
     */
    FrameResult processFrame(cv::Mat& frameMat, const std::string& challenge);

    /**
     * Generates a secure, 128-dimensional float embedding for facial recognition
     * @param alignedFace Mat containing the aligned and cropped face image (112x112 px)
     * @return 128-dimensional feature vector
     */
    std::vector<float> extractEmbedding(const cv::Mat& alignedFace);

    /**
     * Calculates the similarity between two biometric feature vectors
     * @param emb1 First embedding
     * @param emb2 Second embedding
     * @return Cosine similarity score (range -1.0 to 1.0, where > 0.78 is a secure match)
     */
    float compareEmbeddings(const std::vector<float>& emb1, const std::vector<float>& emb2);

    /**
     * Aligns and crops a detected face based on eye-coordinates to handle outdoor rotation/tilt
     * @param sourceFrame Original frame Mat
     * @param landmarks The detected landmark points
     * @return Aligned face crop (112x112 px) suitable for MobileFaceNet
     */
    cv::Mat alignFace(const cv::Mat& sourceFrame, const std::vector<Point2f>& landmarks);
};

} // namespace nhai
