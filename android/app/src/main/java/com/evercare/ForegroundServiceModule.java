package com.evercare;

import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class ForegroundServiceModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ForegroundServiceModule";

    public ForegroundServiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ForegroundServiceModule";
    }

    @ReactMethod
    public void startForegroundService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, FallDetectionForegroundService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "Foreground service started from React Native");
            promise.resolve("Foreground service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start foreground service: " + e.getMessage());
            promise.reject("START_SERVICE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopForegroundService(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            Intent serviceIntent = new Intent(context, FallDetectionForegroundService.class);
            boolean result = context.stopService(serviceIntent);
            
            Log.d(TAG, "Foreground service stop requested from React Native");
            promise.resolve("Foreground service stop requested");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop foreground service: " + e.getMessage());
            promise.reject("STOP_SERVICE_ERROR", e.getMessage());
        }
    }
}