package com.evercare;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import android.content.Intent;
import android.os.Bundle;

public class MainActivity extends ReactActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Start background service when app launches
        // Permissions will be handled by React Native side
        startBackgroundService();
    }
    
    private void startBackgroundService() {
        Intent serviceIntent = new Intent(this, BackgroundService.class);
        startService(serviceIntent);
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "EverCare";
    }

    /**
     * Returns the instance of the ReactActivityDelegate. We use DefaultReactActivityDelegate
     * which allows you to enable New Architecture with a single boolean flag fabricEnabled
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new DefaultReactActivityDelegate(
            this,
            getMainComponentName(),
            // If you opted-in for the New Architecture, we enable the Fabric Renderer.
            DefaultNewArchitectureEntryPoint.getFabricEnabled()
        );
    }
}