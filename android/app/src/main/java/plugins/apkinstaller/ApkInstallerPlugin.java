package plugins.apkinstaller;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.File;


@CapacitorPlugin(
        name = "ApkInstaller",
        permissions = {
                @Permission(
                        alias = "INSTALL_PACKAGES",
                        strings = {Manifest.permission.REQUEST_INSTALL_PACKAGES}
                ),
                @Permission(
                        alias = "MANAGE_EXTERNAL_STORAGE",
                        strings = {Manifest.permission.MANAGE_EXTERNAL_STORAGE}
                )
        }
)
public class ApkInstallerPlugin extends Plugin {

    private ActivityResultLauncher<Intent> installPermissionLauncher;
    private PluginCall pendingCall;

    @PluginMethod
    public void install(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }

        if (filePath.startsWith("file://")) {
            filePath = filePath.substring(7);
        }

        File file = new File(filePath);
        if (!file.exists()) {
            call.reject("File does not exist: " + filePath);
            return;
        }

        Context context = getActivity().getApplicationContext();
        Intent intent = new Intent(Intent.ACTION_VIEW);
        Uri apkUri;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            apkUri = Uri.fromFile(file);
        }

        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.getPackageManager().canRequestPackageInstalls()) {
                Intent permissionIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                permissionIntent.setData(Uri.parse("package:" + context.getPackageName()));

                pendingCall = call;
                getActivity().runOnUiThread(() -> installPermissionLauncher.launch(permissionIntent)); // Chạy trong UI thread
                return;
            }
        }

        context.startActivity(intent);
        call.resolve();
    }

    @Override
    public void load() {
        installPermissionLauncher = getActivity().registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (pendingCall == null) return;

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        if (getContext().getPackageManager().canRequestPackageInstalls()) {
                            install(pendingCall);
                        } else {
                            pendingCall.reject("User denied permission to install unknown apps");
                        }
                    }
                    pendingCall = null;
                }
        );
    }

}
