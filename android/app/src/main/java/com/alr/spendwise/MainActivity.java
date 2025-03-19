package com.alr.spendwise;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import plugins.apkinstaller.ApkInstallerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
